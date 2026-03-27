// Maze Explorer — game logic
"use strict";

(() => {
  // ── Constants (hardcoded for Phase 1; settings UI comes in Phase 2) ──
  const MAZE_WIDTH = 20;
  const MAZE_HEIGHT = 20;
  const VISIBILITY_RADIUS = 2;

  // ── Color palette (read from CSS custom properties at init) ──
  const COLORS = {
    bg: "#000000",
    wall: "#00ffff",
    exit: "#ffaa00",
    player: "#00ff88",
    text: "#ffffff",
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

  // ── Game state ──
  let gameState = null;
  let canvas, ctx;
  let cellSize = 0;

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

    // Start from random cell
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
    const { grid, width, height, playerRow, playerCol, exitRow, exitCol, moveCount } = gameState;
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Draw revealed cells' walls
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.wall;
    ctx.shadowBlur = 8;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (!grid[r][c].revealed) continue;

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

    // Reset shadow for HUD
    ctx.shadowBlur = 0;

    // Update HUD
    const hud = document.getElementById("hud");
    hud.textContent = `Moves: ${moveCount}`;
  }

  // ── Input Handling ──

  function handleKeydown(event) {
    if (!gameState || gameState.state !== "playing") return;

    const dirIndex = KEY_MAP[event.key];
    if (dirIndex === undefined) return;

    event.preventDefault();

    const dir = DIRECTIONS[dirIndex];
    const { playerRow, playerCol, grid } = gameState;

    // Check wall
    if (grid[playerRow][playerCol].walls[dir.wall]) return;

    // Move player
    gameState.playerRow += dir.dr;
    gameState.playerCol += dir.dc;
    gameState.moveCount++;

    // Reveal fog
    revealCells(
      gameState.grid,
      gameState.playerRow,
      gameState.playerCol,
      gameState.visibilityRadius,
      gameState.height,
      gameState.width
    );

    // Check win
    if (checkWin(gameState)) {
      gameState.state = "win";
      render();
      showWinScreen(gameState.moveCount);
      return;
    }

    render();
  }

  // ── Win Screen ──

  function showWinScreen(moveCount) {
    const existing = document.querySelector(".win-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("section");
    overlay.className = "win-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "You won");

    const heading = document.createElement("h2");
    heading.textContent = "You Win!";

    const info = document.createElement("p");
    info.textContent = `Completed in ${moveCount} moves`;

    const playAgainBtn = document.createElement("button");
    playAgainBtn.textContent = "Play Again";
    playAgainBtn.addEventListener("click", () => {
      overlay.remove();
      initGame();
    });

    overlay.append(heading, info, playAgainBtn);
    document.body.appendChild(overlay);
    playAgainBtn.focus();
  }

  // ── Game Initialization ──

  function initGame() {
    const existing = document.querySelector(".win-overlay");
    if (existing) existing.remove();

    const grid = generateMaze(MAZE_WIDTH, MAZE_HEIGHT);

    // Random start position
    const playerRow = Math.floor(Math.random() * MAZE_HEIGHT);
    const playerCol = Math.floor(Math.random() * MAZE_WIDTH);

    // Random exit position (different from start)
    let exitRow, exitCol;
    do {
      exitRow = Math.floor(Math.random() * MAZE_HEIGHT);
      exitCol = Math.floor(Math.random() * MAZE_WIDTH);
    } while (exitRow === playerRow && exitCol === playerCol);

    gameState = {
      grid,
      width: MAZE_WIDTH,
      height: MAZE_HEIGHT,
      playerRow,
      playerCol,
      exitRow,
      exitCol,
      moveCount: 0,
      visibilityRadius: VISIBILITY_RADIUS,
      state: "playing",
    };

    resizeCanvas();

    // Initial reveal around player
    revealCells(grid, playerRow, playerCol, VISIBILITY_RADIUS, MAZE_HEIGHT, MAZE_WIDTH);

    render();
  }

  // ── Bootstrap ──

  function setup() {
    canvas = document.getElementById("maze-canvas");
    ctx = canvas.getContext("2d");

    // Read CSS custom properties
    const style = getComputedStyle(document.documentElement);
    COLORS.bg = style.getPropertyValue("--color-bg").trim() || COLORS.bg;
    COLORS.wall = style.getPropertyValue("--color-wall").trim() || COLORS.wall;
    COLORS.exit = style.getPropertyValue("--color-exit").trim() || COLORS.exit;
    COLORS.player = style.getPropertyValue("--color-player").trim() || COLORS.player;
    COLORS.text = style.getPropertyValue("--color-text").trim() || COLORS.text;

    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", () => {
      if (gameState && gameState.state === "playing") {
        resizeCanvas();
        render();
      }
    });

    initGame();
  }

  document.addEventListener("DOMContentLoaded", setup);
})();
