// A-maze-ng — game logic
"use strict";

(() => {
  // ── Color palette (read from CSS custom properties at init) ──
  const COLORS = {
    bg: "#000000",
    wall: "#00ffff",
    exit: "#ffaa00",
    player: "#00ff88",
    text: "#ffffff",
    path: "#ff00ff",
  };

  // ── Direction vectors ──
  const DIRECTIONS = [
    { dr: -1, dc: 0, wall: "top", opposite: "bottom" },
    { dr: 0, dc: 1, wall: "right", opposite: "left" },
    { dr: 1, dc: 0, wall: "bottom", opposite: "top" },
    { dr: 0, dc: -1, wall: "left", opposite: "right" },
  ];

  const KEY_MAP = {
    ArrowUp: 0, w: 0, W: 0,
    ArrowRight: 1, d: 1, D: 1,
    ArrowDown: 2, s: 2, S: 2,
    ArrowLeft: 3, a: 3, A: 3,
  };

  const MIN_SIZE = 2;
  const MAX_SIZE = 80;
  const MAX_SCORES = 10;
  const SWIPE_THRESHOLD = 20;
  const MOVE_REPEAT_MS = 150;

  // ── Game state ──
  let gameState = null;
  let canvas, ctx;
  let cellSize = 0;

  // Current settings (preserved across games for "Play Again")
  let currentSettings = { width: 20, height: 20, radius: 2 };

  // ── Touch state ──
  let touchActive = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastDirection = null;
  let moveTimer = null;

  // ── DOM References ──
  let startScreen, gameScreen, winScreen, abortScreen, scoreboardScreen;

  // ── Grid & Maze Generation ──

  function createGrid(width, height) {
    const grid = [];
    for (let r = 0; r < height; r++) {
      const row = [];
      for (let c = 0; c < width; c++) {
        row.push({
          walls: { top: true, right: true, bottom: true, left: true },
          revealed: false,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  function generateMaze(width, height) {
    const grid = createGrid(width, height);
    const visited = Array.from({ length: height }, () =>
      new Uint8Array(width)
    );
    const stack = [];

    const startR = Math.floor(Math.random() * height);
    const startC = Math.floor(Math.random() * width);
    visited[startR][startC] = 1;
    stack.push({ r: startR, c: startC });

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];

      for (const dir of DIRECTIONS) {
        const nr = current.r + dir.dr;
        const nc = current.c + dir.dc;
        if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited[nr][nc]) {
          neighbors.push({ r: nr, c: nc, wall: dir.wall, opposite: dir.opposite });
        }
      }

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[current.r][current.c].walls[next.wall] = false;
        grid[next.r][next.c].walls[next.opposite] = false;
        visited[next.r][next.c] = 1;
        stack.push({ r: next.r, c: next.c });
      } else {
        stack.pop();
      }
    }

    return grid;
  }

  // ── BFS Shortest Path ──

  function findShortestPath(grid, startRow, startCol, exitRow, exitCol, width, height) {
    const parent = new Map();
    const startKey = `${startRow},${startCol}`;
    parent.set(startKey, null);

    const queue = [{ r: startRow, c: startCol }];
    let head = 0;

    while (head < queue.length) {
      const current = queue[head++];

      if (current.r === exitRow && current.c === exitCol) {
        // Reconstruct path
        const path = [];
        let key = `${current.r},${current.c}`;
        while (key !== null) {
          const [r, c] = key.split(",").map(Number);
          path.unshift({ row: r, col: c });
          key = parent.get(key);
        }
        return path;
      }

      for (const dir of DIRECTIONS) {
        if (grid[current.r][current.c].walls[dir.wall]) continue;
        const nr = current.r + dir.dr;
        const nc = current.c + dir.dc;
        if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
        const nKey = `${nr},${nc}`;
        if (parent.has(nKey)) continue;
        parent.set(nKey, `${current.r},${current.c}`);
        queue.push({ r: nr, c: nc });
      }
    }

    return [];
  }

  // ── Fog of War ──

  function revealCells(grid, row, col, radius, height, width) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) + Math.abs(dc) <= radius) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
            grid[nr][nc].revealed = true;
          }
        }
      }
    }
  }

  function revealAllCells(grid, height, width) {
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        grid[r][c].revealed = true;
      }
    }
  }

  // ── Win Detection ──

  function checkWin(state) {
    return state.playerRow === state.exitRow && state.playerCol === state.exitCol;
  }

  // ── Rendering ──

  function calculateCellSize() {
    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - 100;
    const dim = Math.min(maxW, maxH);
    return Math.floor(dim / Math.max(gameState.width, gameState.height));
  }

  function resizeCanvas() {
    cellSize = calculateCellSize();
    canvas.width = cellSize * gameState.width;
    canvas.height = cellSize * gameState.height;
  }

  function render() {
    const { grid, width, height, playerRow, playerCol, exitRow, exitCol, state } = gameState;
    const w = canvas.width;
    const h = canvas.height;
    const showAll = state === "win" || state === "abort";

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Draw revealed cells' walls
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.wall;
    ctx.shadowBlur = 8;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (!grid[r][c].revealed && !showAll) continue;

        const x = c * cellSize;
        const y = r * cellSize;
        const cell = grid[r][c];

        ctx.beginPath();
        if (cell.walls.top) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
        }
        if (cell.walls.right) {
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
        }
        if (cell.walls.bottom) {
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
        }
        if (cell.walls.left) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
        }
        ctx.stroke();
      }
    }

    // Draw optimal path on win/abort
    if (showAll && gameState.optimalPath) {
      drawOptimalPath(gameState.optimalPath);
    }

    // Draw exit marker (always visible)
    ctx.shadowColor = COLORS.exit;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.exit;
    const exitX = exitCol * cellSize + cellSize / 2;
    const exitY = exitRow * cellSize + cellSize / 2;
    const exitRadius = cellSize * 0.3;
    ctx.beginPath();
    ctx.arc(exitX, exitY, exitRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw player
    ctx.shadowColor = COLORS.player;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.player;
    const px = playerCol * cellSize + cellSize / 2;
    const py = playerRow * cellSize + cellSize / 2;
    const pRadius = cellSize * 0.25;
    ctx.beginPath();
    ctx.arc(px, py, pRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw directional arrow during swipe
    if (touchActive && state === "playing" && lastDirection !== null) {
      drawDirectionArrow(playerCol, playerRow, lastDirection);
    }

    ctx.shadowBlur = 0;

    // Update HUD
    document.getElementById("hud-moves").textContent = `Moves: ${gameState.moveCount}`;
  }

  function drawOptimalPath(path) {
    ctx.fillStyle = COLORS.path;
    ctx.shadowColor = COLORS.path;
    ctx.shadowBlur = 6;

    for (const { row, col } of path) {
      const x = col * cellSize + cellSize * 0.25;
      const y = row * cellSize + cellSize * 0.25;
      const size = cellSize * 0.5;
      ctx.fillRect(x, y, size, size);
    }

    ctx.shadowBlur = 0;
  }

  function drawDirectionArrow(playerCol, playerRow, dirIndex) {
    const dir = DIRECTIONS[dirIndex];
    const cx = playerCol * cellSize + cellSize / 2;
    const cy = playerRow * cellSize + cellSize / 2;
    const pRadius = cellSize * 0.25;
    const arrowSize = Math.max(6, cellSize * 0.15);

    // Position arrow at edge of player circle
    const ax = cx + dir.dc * (pRadius + arrowSize * 0.8);
    const ay = cy + dir.dr * (pRadius + arrowSize * 0.8);

    ctx.fillStyle = COLORS.player;
    ctx.shadowColor = COLORS.player;
    ctx.shadowBlur = 4;
    ctx.beginPath();

    if (dir.dc === 1) {
      // Right
      ctx.moveTo(ax + arrowSize, ay);
      ctx.lineTo(ax - arrowSize * 0.5, ay - arrowSize * 0.6);
      ctx.lineTo(ax - arrowSize * 0.5, ay + arrowSize * 0.6);
    } else if (dir.dc === -1) {
      // Left
      ctx.moveTo(ax - arrowSize, ay);
      ctx.lineTo(ax + arrowSize * 0.5, ay - arrowSize * 0.6);
      ctx.lineTo(ax + arrowSize * 0.5, ay + arrowSize * 0.6);
    } else if (dir.dr === -1) {
      // Up
      ctx.moveTo(ax, ay - arrowSize);
      ctx.lineTo(ax - arrowSize * 0.6, ay + arrowSize * 0.5);
      ctx.lineTo(ax + arrowSize * 0.6, ay + arrowSize * 0.5);
    } else {
      // Down
      ctx.moveTo(ax, ay + arrowSize);
      ctx.lineTo(ax - arrowSize * 0.6, ay - arrowSize * 0.5);
      ctx.lineTo(ax + arrowSize * 0.6, ay - arrowSize * 0.5);
    }

    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Movement ──

  function attemptMove(dirIndex) {
    if (!gameState || gameState.state !== "playing") return;

    const dir = DIRECTIONS[dirIndex];
    const { playerRow, playerCol, grid } = gameState;

    if (grid[playerRow][playerCol].walls[dir.wall]) return;

    gameState.playerRow += dir.dr;
    gameState.playerCol += dir.dc;
    gameState.moveCount++;

    revealCells(
      gameState.grid,
      gameState.playerRow,
      gameState.playerCol,
      gameState.visibilityRadius,
      gameState.height,
      gameState.width
    );

    if (checkWin(gameState)) {
      gameState.state = "win";
      revealAllCells(gameState.grid, gameState.height, gameState.width);
      render();
      const efficiency = (gameState.optimalPathLength / gameState.moveCount) * 100;
      const isBest = saveScore(gameState.moveCount, efficiency);
      showWinScreen(gameState.moveCount, efficiency, gameState.optimalPathLength, isBest);
      clearTouchState();
      return;
    }

    render();
  }

  // ── Input Handling: Keyboard ──

  function handleKeydown(event) {
    if (!gameState || gameState.state !== "playing") return;

    const dirIndex = KEY_MAP[event.key];
    if (dirIndex === undefined) return;

    event.preventDefault();
    attemptMove(dirIndex);
  }

  // ── Input Handling: Touch/Swipe ──

  function clearTouchState() {
    touchActive = false;
    lastDirection = null;
    if (moveTimer !== null) {
      clearInterval(moveTimer);
      moveTimer = null;
    }
  }

  function dominantDirection(dx, dy) {
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return null;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? 1 : 3; // right : left
    }
    return dy > 0 ? 2 : 0; // down : up
  }

  function handleTouchStart(event) {
    if (!gameState || gameState.state !== "playing") return;
    event.preventDefault();

    const touch = event.touches[0];
    touchActive = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    lastDirection = null;
  }

  function handleTouchMove(event) {
    if (!gameState || gameState.state !== "playing" || !touchActive) return;
    event.preventDefault();

    const touch = event.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const direction = dominantDirection(dx, dy);

    if (direction === null) return;

    if (direction !== lastDirection) {
      lastDirection = direction;
      if (moveTimer !== null) {
        clearInterval(moveTimer);
      }
      attemptMove(direction);
      moveTimer = setInterval(() => attemptMove(direction), MOVE_REPEAT_MS);
    }

    // Update reference coordinates for continuous tracking
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function handleTouchEnd(event) {
    if (!gameState || gameState.state !== "playing") return;
    event.preventDefault();

    clearTouchState();
    render(); // Remove directional arrow
  }

  // ── Score Manager ──

  function scoreKey(w, h, r) {
    return `amazeng_scores_${w}x${h}_r${r}`;
  }

  function loadScores(w, h, r) {
    try {
      const raw = localStorage.getItem(scoreKey(w, h, r));
      if (!raw) return [];
      const scores = JSON.parse(raw);
      if (!Array.isArray(scores)) return [];
      return scores;
    } catch {
      return [];
    }
  }

  function saveScore(moveCount, efficiency) {
    const { width, height, visibilityRadius } = gameState;
    const key = scoreKey(width, height, visibilityRadius);
    const scores = loadScores(width, height, visibilityRadius);
    const effRounded = Math.round(efficiency * 10) / 10;
    const entry = {
      efficiency: effRounded,
      moves: moveCount,
      size: `${width}x${height}`,
      date: new Date().toISOString().slice(0, 10),
    };

    scores.push(entry);
    // Sort: highest efficiency first, then fewest moves
    scores.sort((a, b) => {
      if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
      return a.moves - b.moves;
    });
    const trimmed = scores.slice(0, MAX_SCORES);

    // Check if this score is the new personal best (top of sorted list)
    const isBest = trimmed.length > 0 &&
      trimmed[0].efficiency === effRounded &&
      trimmed[0].moves === moveCount;

    try {
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {
      // localStorage unavailable — degrade gracefully
    }

    return isBest;
  }

  // ── Validation ──

  function validateSettings(width, height) {
    const errors = [];

    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      errors.push("Width and height must be whole numbers.");
    } else {
      if (width < MIN_SIZE || width > MAX_SIZE) {
        errors.push(`Width must be between ${MIN_SIZE} and ${MAX_SIZE}.`);
      }
      if (height < MIN_SIZE || height > MAX_SIZE) {
        errors.push(`Height must be between ${MIN_SIZE} and ${MAX_SIZE}.`);
      }
    }

    return errors;
  }

  // ── Screen Transitions ──

  function hideAllScreens() {
    startScreen.hidden = true;
    gameScreen.hidden = true;
    winScreen.hidden = true;
    abortScreen.hidden = true;
    scoreboardScreen.hidden = true;
    document.getElementById("abort-btn").hidden = false;
    document.getElementById("controls-hint").hidden = false;
  }

  function lockScroll() {
    document.body.classList.add("game-active");
  }

  function unlockScroll() {
    document.body.classList.remove("game-active");
  }

  function showStartScreen() {
    hideAllScreens();
    clearTouchState();
    unlockScroll();
    startScreen.hidden = false;
    if (gameState) {
      gameState.state = "start";
    }
    document.getElementById("start-btn").focus();
  }

  function showWinScreen(moveCount, efficiency, optimalPathLength, isBest) {
    unlockScroll();
    document.getElementById("abort-btn").hidden = true;
    document.getElementById("controls-hint").hidden = true;
    winScreen.hidden = false;
    document.getElementById("win-efficiency").textContent = `Efficiency: ${efficiency.toFixed(1)}%`;
    document.getElementById("win-moves").textContent = `Moves: ${moveCount}`;
    document.getElementById("win-optimal").textContent = `Optimal path: ${optimalPathLength} steps`;

    const bestEl = document.getElementById("win-best");
    bestEl.hidden = !isBest;

    document.getElementById("play-again-btn").focus();
  }

  function showAbortScreen() {
    gameState.state = "abort";
    revealAllCells(gameState.grid, gameState.height, gameState.width);
    clearTouchState();
    render();

    unlockScroll();
    document.getElementById("abort-btn").hidden = true;
    document.getElementById("controls-hint").hidden = true;
    abortScreen.hidden = false;
    document.getElementById("abort-info").textContent =
      `Optimal path was ${gameState.optimalPathLength} steps. You made ${gameState.moveCount} moves.`;
    document.getElementById("abort-menu-btn").focus();
  }

  function showGameScreen() {
    hideAllScreens();
    lockScroll();
    gameScreen.hidden = false;
  }

  function showScoreboardScreen() {
    hideAllScreens();
    unlockScroll();
    scoreboardScreen.hidden = false;
    refreshScoreboard();
    document.getElementById("sb-back-btn").focus();
  }

  function refreshScoreboard() {
    const sizeVal = document.getElementById("sb-size").value;
    const radiusVal = parseInt(document.getElementById("sb-radius").value, 10);
    const [w, h] = sizeVal.split("x").map(Number);

    const scores = loadScores(w, h, radiusVal);
    const tbody = document.getElementById("scoreboard-body");
    const noMsg = document.getElementById("no-scores-msg");
    const table = document.getElementById("scoreboard-table");

    tbody.innerHTML = "";

    if (scores.length === 0) {
      table.hidden = true;
      noMsg.hidden = false;
    } else {
      table.hidden = false;
      noMsg.hidden = true;
      for (let i = 0; i < scores.length; i++) {
        const tr = document.createElement("tr");
        const tdRank = document.createElement("td");
        tdRank.textContent = `${i + 1}`;
        const tdEff = document.createElement("td");
        tdEff.textContent = `${scores[i].efficiency}%`;
        const tdMoves = document.createElement("td");
        tdMoves.textContent = `${scores[i].moves}`;
        const tdSize = document.createElement("td");
        tdSize.textContent = scores[i].size || "-";
        const tdDate = document.createElement("td");
        tdDate.textContent = scores[i].date;
        tr.append(tdRank, tdEff, tdMoves, tdSize, tdDate);
        tbody.appendChild(tr);
      }
    }
  }

  // ── Game Initialization ──

  function initGame(width, height, radius) {
    currentSettings = { width, height, radius };

    const grid = generateMaze(width, height);

    const playerRow = Math.floor(Math.random() * height);
    const playerCol = Math.floor(Math.random() * width);

    let exitRow, exitCol;
    do {
      exitRow = Math.floor(Math.random() * height);
      exitCol = Math.floor(Math.random() * width);
    } while (exitRow === playerRow && exitCol === playerCol);

    const optimalPath = findShortestPath(grid, playerRow, playerCol, exitRow, exitCol, width, height);
    const optimalPathLength = optimalPath.length > 0 ? optimalPath.length - 1 : 0;

    gameState = {
      grid,
      width,
      height,
      playerRow,
      playerCol,
      exitRow,
      exitCol,
      moveCount: 0,
      visibilityRadius: radius,
      optimalPath,
      optimalPathLength,
      state: "playing",
    };

    showGameScreen();
    resizeCanvas();

    revealCells(grid, playerRow, playerCol, radius, height, width);

    render();
  }

  // ── Start Screen Logic ──

  function getSelectedSize() {
    const selected = document.querySelector(".preset-btn.selected");
    if (!selected) return { width: 20, height: 20 };

    const w = selected.dataset.width;
    const h = selected.dataset.height;

    if (w === "custom") {
      return {
        width: parseInt(document.getElementById("custom-width").value, 10),
        height: parseInt(document.getElementById("custom-height").value, 10),
      };
    }

    return { width: parseInt(w, 10), height: parseInt(h, 10) };
  }

  function handleStartClick() {
    const sizeError = document.getElementById("size-error");
    sizeError.hidden = true;

    const { width, height } = getSelectedSize();
    const radius = parseInt(document.getElementById("radius-select").value, 10);

    const errors = validateSettings(width, height);
    if (errors.length > 0) {
      sizeError.textContent = errors.join(" ");
      sizeError.hidden = false;
      return;
    }

    initGame(width, height, radius);
  }

  function setupPresetButtons() {
    const buttons = document.querySelectorAll(".preset-btn");
    const customInputs = document.getElementById("custom-size-inputs");

    for (const btn of buttons) {
      btn.addEventListener("click", () => {
        for (const b of buttons) {
          b.classList.remove("selected");
        }
        btn.classList.add("selected");

        if (btn.dataset.width === "custom") {
          customInputs.hidden = false;
        } else {
          customInputs.hidden = true;
        }
      });
    }
  }

  function setupRadiusSlider() {
    const slider = document.getElementById("radius-select");
    const output = document.getElementById("radius-value");
    slider.addEventListener("input", () => {
      output.textContent = slider.value;
    });
  }

  function setupSquareCheckbox() {
    const checkbox = document.getElementById("square-check");
    const widthInput = document.getElementById("custom-width");
    const heightInput = document.getElementById("custom-height");
    const widthOutput = document.getElementById("custom-width-value");
    const heightOutput = document.getElementById("custom-height-value");
    const heightSlider = document.getElementById("height-slider");

    function updateVisibility() {
      heightSlider.hidden = checkbox.checked;
      if (checkbox.checked) {
        heightInput.value = widthInput.value;
        heightOutput.textContent = widthInput.value;
      }
    }

    widthInput.addEventListener("input", () => {
      widthOutput.textContent = widthInput.value;
      if (checkbox.checked) {
        heightInput.value = widthInput.value;
        heightOutput.textContent = widthInput.value;
      }
    });

    heightInput.addEventListener("input", () => {
      heightOutput.textContent = heightInput.value;
    });

    checkbox.addEventListener("change", updateVisibility);
    updateVisibility();
  }

  function setupControlsHint() {
    const hint = document.getElementById("controls-hint");
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (hasTouch) {
      hint.textContent = "Drag to move";
    } else {
      hint.textContent = "Use WASD or arrow keys to move";
    }
  }

  // ── Bootstrap ──

  function setup() {
    canvas = document.getElementById("maze-canvas");
    ctx = canvas.getContext("2d");

    startScreen = document.getElementById("start-screen");
    gameScreen = document.getElementById("game-screen");
    winScreen = document.getElementById("win-screen");
    abortScreen = document.getElementById("abort-screen");
    scoreboardScreen = document.getElementById("scoreboard-screen");

    // Read CSS custom properties
    const style = getComputedStyle(document.documentElement);
    COLORS.bg = style.getPropertyValue("--color-bg").trim() || COLORS.bg;
    COLORS.wall = style.getPropertyValue("--color-wall").trim() || COLORS.wall;
    COLORS.exit = style.getPropertyValue("--color-exit").trim() || COLORS.exit;
    COLORS.player = style.getPropertyValue("--color-player").trim() || COLORS.player;
    COLORS.text = style.getPropertyValue("--color-text").trim() || COLORS.text;
    COLORS.path = style.getPropertyValue("--color-path").trim() || COLORS.path;

    // Keyboard input
    document.addEventListener("keydown", handleKeydown);

    // Touch input
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Window resize
    const handleResize = () => {
      if (gameState && (gameState.state === "playing" || gameState.state === "win" || gameState.state === "abort")) {
        resizeCanvas();
        render();
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Start screen controls
    setupPresetButtons();
    setupRadiusSlider();
    setupSquareCheckbox();

    document.getElementById("start-btn").addEventListener("click", handleStartClick);
    document.getElementById("scoreboard-btn").addEventListener("click", showScoreboardScreen);

    // Abort button
    document.getElementById("abort-btn").addEventListener("click", () => {
      if (gameState && gameState.state === "playing") {
        showAbortScreen();
      }
    });

    // Abort screen: back to menu
    document.getElementById("abort-menu-btn").addEventListener("click", showStartScreen);

    // Win screen controls
    document.getElementById("play-again-btn").addEventListener("click", () => {
      winScreen.hidden = true;
      initGame(currentSettings.width, currentSettings.height, currentSettings.radius);
    });
    document.getElementById("back-to-menu-btn").addEventListener("click", () => {
      winScreen.hidden = true;
      showStartScreen();
    });

    // Scoreboard controls
    document.getElementById("sb-back-btn").addEventListener("click", showStartScreen);
    document.getElementById("sb-size").addEventListener("change", refreshScoreboard);
    document.getElementById("sb-radius").addEventListener("change", refreshScoreboard);

    // Controls hint + show start screen
    setupControlsHint();
    showStartScreen();
  }

  document.addEventListener("DOMContentLoaded", setup);
})();
