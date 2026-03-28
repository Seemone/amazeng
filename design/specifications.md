# Specifications: A-maze-ng

## System Context

### Technology Stack

| Layer | Technology | Rationale |
| ----- | ---------- | --------- |
| Markup | HTML5 | Semantic page shell, no framework needed |
| Styling | CSS3 | Layout, start/win screen UI, CSS custom properties for neon color palette, responsive design |
| Logic | Vanilla JavaScript (ES2020+) | All game logic — no dependencies |
| Rendering | HTML Canvas 2D API | Performant grid rendering, native glow effects via `shadowBlur` |
| Persistence | localStorage | Browser-local scoreboard, no backend |
| Distribution | POSIX shell script | Inlines CSS/JS into single HTML file for sharing |

### Deployment Architecture

Primary deployment: GitHub Pages at `https://seemone.github.io/amazeng/`. Also works from any HTTP server or opened directly as `file://`. No bundler, no server-side logic.

```
browsergame/
  index.html
  style.css
  game.js
  build.sh          # produces amazeng.html
  deploy.sh         # build + cache-bust + push + wait for GitHub Pages
  amazeng.html      # generated — single-file distribution (gitignored)
```

### Cache Strategy

- `index.html` includes HTTP cache-control meta tags (`no-cache, no-store, must-revalidate`) to prevent stale HTML.
- `deploy.sh` appends `?v=<timestamp>` query strings to `style.css` and `game.js` references before committing, ensuring browsers fetch fresh CSS/JS on each deploy. Working copy is restored to clean references after push.
- `amazeng.html` is self-contained (inlined CSS/JS) and not affected by cache-busting — it is always rebuilt from clean sources.

## User Experience Architecture

### User Persona

**Casual puzzle player**: Opens a URL or taps a shared file, wants to play immediately. No sign-up, no install. Expects intuitive controls (keyboard on desktop, swipe on mobile) and a clean modern look. Motivated by self-improvement (beating their own efficiency scores).

### User Journey

1. Load page → see start screen with game title "A-maze-ng" and settings
2. Choose maze size and visibility radius → click/tap Start
3. Navigate the maze using keyboard or swipe → fog reveals as they explore
4. Reach the exit → see efficiency score, move count, optimal path on maze, option to replay or return to menu
5. Optionally abort mid-game → see full maze with optimal path, then return to menu
6. Optionally view scoreboard from start screen

### Interaction Patterns

- **Desktop input**: Discrete keyboard events (keydown). One key = one move. No mouse interaction during gameplay.
- **Mobile input**: Touch swipe gestures. Continuous movement while finger is held and dragged. Direction changes on swipe angle change. Walls stop movement without lifting finger.
- **Feedback**: Immediate visual update on every move (canvas redraws). Move counter updates in real time. Directional arrow shows swipe direction on mobile.
- **Orientation**: Exit marker always visible through fog — player always knows which direction to aim for.

### Error Experience

- Invalid custom size: inline message next to input fields, game does not start
- localStorage unavailable: game plays normally, scores silently not persisted
- JavaScript unavailable (e.g., Telegram in-app viewer): `<noscript>` message directs user to open in Safari or Chrome

## Component Design

### Game State Machine

```
START_SCREEN ──[Start]──> PLAYING ──[Reach Exit]──> WIN_SCREEN
     ^                       │                          │
     │                       │                          │
     │                   [Abort]                        │
     │                       │                          │
     │                       v                          │
     │                  ABORT_SCREEN                    │
     │                       │                          │
     └──[Back to Menu]───────┘──────────────────────────┘
     ^                                                  │
     └──────────────[Play Again]─────> PLAYING ─────────┘
```

States:
- **START_SCREEN**: Settings UI visible. Canvas may show decorative background.
- **PLAYING**: Canvas renders maze, player, exit, fog. Keyboard/touch input active. HUD shows move count. Abort button visible.
- **WIN_SCREEN**: Results panel shown inline below the canvas with efficiency score, move count, optimal path length, personal best status, navigation buttons. Maze fully revealed with optimal path drawn in magenta. Page scroll unlocked so user can view full maze and results.
- **ABORT_SCREEN**: Full maze revealed with optimal path drawn in magenta. Results panel shown inline below canvas with path info and "Back to Menu" button. Page scroll unlocked.

### Module Breakdown (within game.js)

| Module | Responsibility |
| ------ | -------------- |
| Maze Generator | Recursive backtracker algorithm, produces grid data structure |
| Grid Model | 2D cell array, wall states, revealed states, player/exit positions |
| Pathfinder | BFS shortest path from start to exit, stores path as coordinate array |
| Renderer | Canvas drawing — background, walls, fog, exit beacon, player, optimal path, directional arrow, HUD |
| Input Handler | Keyboard event listener, touch/swipe gesture handler, movement validation, move counting |
| Fog Controller | Visibility radius logic, permanent cell reveal on movement |
| Score Manager | localStorage read/write, efficiency calculation, top-10 per config, personal best detection |
| UI Controller | Start screen, win screen, abort screen, state transitions, settings form |
| Touch Controller | Swipe gesture detection, continuous movement, direction change, wall collision during drag |

### Grid Data Model

```
Cell {
  walls: { top: bool, right: bool, bottom: bool, left: bool }  // true = wall present
  revealed: bool  // false at start, permanently true once within visibility radius
}

Grid: Cell[][]  // grid[row][col], 0-indexed

GameState {
  grid: Grid
  width: int
  height: int
  playerRow: int
  playerCol: int
  exitRow: int
  exitCol: int
  moveCount: int
  visibilityRadius: int
  optimalPath: [{row, col}]  // BFS result, stored at generation time
  optimalPathLength: int     // number of steps in shortest path
  state: "start" | "playing" | "win" | "abort"
}
```

### Maze Generation Algorithm

**Recursive Backtracker** (iterative implementation using explicit stack to avoid call stack overflow on large mazes):

```
function generateMaze(width, height):
  grid = createGrid(width, height)  // all walls intact
  stack = []
  visited = Set()

  start = randomCell()
  visited.add(start)
  stack.push(start)

  while stack is not empty:
    current = stack.peek()
    neighbors = unvisitedNeighbors(current, visited)

    if neighbors is not empty:
      next = randomChoice(neighbors)
      removeWallBetween(current, next)
      visited.add(next)
      stack.push(next)
    else:
      stack.pop()

  return grid
```

Uses an explicit stack (not recursion) to handle 80x80 grids (6400 cells) without stack overflow.

### BFS Shortest Path Algorithm

Computed once at maze generation time, stored in `gameState.optimalPath`.

```
function findShortestPath(grid, startRow, startCol, exitRow, exitCol):
  queue = [{row: startRow, col: startCol, path: [{row: startRow, col: startCol}]}]
  visited = Set()
  visited.add(key(startRow, startCol))

  while queue is not empty:
    current = queue.dequeue()

    if current.row == exitRow and current.col == exitCol:
      return current.path

    for each direction in [top, right, bottom, left]:
      if not wallBlocks(grid, current.row, current.col, direction):
        nr, nc = current.row + dir.dr, current.col + dir.dc
        if not visited.has(key(nr, nc)):
          visited.add(key(nr, nc))
          queue.enqueue({row: nr, col: nc, path: [...current.path, {row: nr, col: nc}]})

  return []  // should never happen in a perfect maze
```

**Optimization**: Instead of copying full paths, store parent pointers and reconstruct path at the end. Memory: O(W*H) visited set + O(W*H) parent map. Time: O(W*H).

### Visibility Calculation

When player moves to cell (r, c) with radius R:

```
for dr in range(-R, R+1):
  for dc in range(-R, R+1):
    if abs(dr) + abs(dc) <= R:
      nr, nc = r + dr, c + dc
      if inBounds(nr, nc):
        grid[nr][nc].revealed = true
```

Manhattan distance: diamond-shaped reveal pattern.

### Rendering Pipeline

On each move:

1. Clear canvas (fill black)
2. For each cell in grid:
   - If revealed (or state is win/abort where all cells shown): draw open passages (dark), draw walls (neon color + shadowBlur glow)
   - If not revealed: skip (black background shows through)
3. If state is win or abort: draw optimal path cells (magenta fill with glow)
4. Draw exit marker at exit cell position (always, regardless of revealed state). Gold/orange with strong shadowBlur glow.
5. Draw player marker at player cell position. Bright contrasting color.
6. If swipe active: draw directional arrow around player circle.
7. Draw HUD: move counter text overlay.

### Optimal Path Rendering

When displayed (win or abort states):

```
function drawOptimalPath(path):
  ctx.fillStyle = COLORS.pathHighlight  // magenta
  ctx.shadowColor = COLORS.pathHighlight
  ctx.shadowBlur = 6

  for each {row, col} in path:
    x = col * cellSize + cellSize * 0.25
    y = row * cellSize + cellSize * 0.25
    w = cellSize * 0.5
    h = cellSize * 0.5
    ctx.fillRect(x, y, w, h)
```

Small centered squares in each path cell, drawn before player/exit markers so they appear beneath.

### Directional Arrow Rendering

During active swipe, draw a small triangle pointing in the movement direction, offset from the player circle edge:

```
function drawDirectionArrow(playerCol, playerRow, direction):
  // Position arrow at edge of player circle in the movement direction
  // Triangle pointing outward, 6-8px size
  // Same color as player (green) with slight glow
```

### Touch/Swipe Input System

```
State:
  touchActive: bool
  touchStartX, touchStartY: number
  lastDirection: int | null
  moveTimer: interval ID

on touchstart(event):
  touchActive = true
  touchStartX = event.touches[0].clientX
  touchStartY = event.touches[0].clientY
  lastDirection = null
  preventDefault()

on touchmove(event):
  dx = event.touches[0].clientX - touchStartX
  dy = event.touches[0].clientY - touchStartY
  direction = dominantDirection(dx, dy)  // threshold: > 20px movement

  if direction != lastDirection:
    lastDirection = direction
    clearInterval(moveTimer)
    movePlayer(direction)  // immediate first move
    moveTimer = setInterval(() => movePlayer(direction), 150ms)  // repeat

  // Update reference point for continuous tracking
  touchStartX = event.touches[0].clientX
  touchStartY = event.touches[0].clientY
  preventDefault()

on touchend:
  touchActive = false
  clearInterval(moveTimer)
  lastDirection = null
```

Movement repeat rate: ~150ms (6-7 cells/second) for comfortable continuous movement.

### Cell Size Calculation

```
cellSize = min(canvasWidth, canvasHeight) / max(gridWidth, gridHeight)
```

Canvas sized to fill most of the viewport via CSS, with padding for HUD. On mobile, canvas fills available width minus safe area insets.

### Efficiency Score Calculation

```
efficiency = (optimalPathLength / moveCount) * 100
```

Displayed as percentage rounded to one decimal place (e.g., "87.3%"). Perfect score is 100% (player took the optimal path). Score can be very low for wandering players.

### Scoring & Persistence

**localStorage key format**: `amazeng_scores_<width>x<height>_r<radius>`

Example: `amazeng_scores_20x20_r2`

**Stored value**: JSON array of top 10 entries:
```
[
  { "efficiency": 87.3, "moves": 42, "size": "20x20", "date": "2026-03-27" },
  { "efficiency": 73.1, "moves": 56, "size": "20x20", "date": "2026-03-26" }
]
```

Sorted descending by efficiency, then ascending by moves. On game win, insert if qualifies for top 10, trim to 10.

### Color Palette (CSS Custom Properties)

```css
:root {
  --color-bg: #000000;
  --color-wall: #00ffff;        /* cyan neon */
  --color-wall-alt: #ff00ff;    /* magenta neon — used for optimal path */
  --color-exit: #ffaa00;        /* warm gold/orange */
  --color-player: #00ff88;      /* electric green */
  --color-text: #ffffff;
  --color-glow: rgba(0, 255, 255, 0.6);
  --color-path: #ff00ff;        /* magenta — optimal path highlight */
}
```

### Responsive Layout Strategy

**Breakpoints**:
- Desktop: >= 768px width — current layout, keyboard controls
- Mobile: < 768px width — stacked layout, larger touch targets, swipe controls

**Mobile adaptations**:
- Start screen: full-width form, larger buttons (min 44px tap targets)
- Canvas: fills viewport width minus 16px padding, height adjusts proportionally
- HUD: repositioned above canvas, larger font
- Abort button: fixed position, large tap target, semi-transparent
- Win/abort screens: full-viewport overlay with larger text and buttons
- Scoreboard: horizontally scrollable table if needed

**Viewport meta**: Already present (`width=device-width, initial-scale=1.0`). Add `user-scalable=no` to prevent zoom conflicts with swipe.

### Build Script

```bash
#!/bin/sh
# build.sh — produces amazeng.html with inlined CSS and JS
set -e

CSS=$(cat style.css)
JS=$(cat game.js)

sed -e '/<link rel="stylesheet".*>/r /dev/stdin' \
    -e '/<link rel="stylesheet".*>/d' \
    index.html <<EOF_CSS | \
sed -e '/<script src="game.js".*>/r /dev/stdin' \
    -e '/<script src="game.js".*>/d' > amazeng.html <<EOF_JS
<style>
$CSS
</style>
EOF_CSS
<script>
$JS
</script>
EOF_JS

echo "Built amazeng.html ($(wc -c < amazeng.html | tr -d ' ') bytes)"
```

### Custom Size Input

Custom maze dimensions use range sliders (not number inputs) for better mobile usability:
- Width slider: range 2-80, default 20, with live `<output>` display
- Height slider: same range, shown only when "Square maze" is unchecked
- "Square maze" checkbox: checked by default. When enabled, hides the height slider and syncs height to width value. Unchecking reveals the height slider for independent control.

### Controls Hint

A context-aware hint is displayed below the canvas during gameplay:
- Touch-capable devices (`"ontouchstart" in window || navigator.maxTouchPoints > 0`): "Drag to move"
- Non-touch devices: "Use WASD or arrow keys to move"
- Hidden when win/abort panel appears.

### Scroll Management

- **During PLAYING**: `html.game-active` class sets `overflow: hidden; height: 100%` on `<html>` and `<body>`, preventing page scroll that would interfere with swipe controls.
- **On game end (WIN/ABORT)**: Class removed, `window.scrollTo(0, 0)` called to nudge iOS into recognizing scroll is re-enabled. Page becomes scrollable so the inline results panel below the canvas is reachable.
- **On menu/scoreboard screens**: No scroll lock; body uses default `overflow: auto`.

### CSS Hidden Attribute

Global rule `[hidden] { display: none !important }` ensures the HTML5 `hidden` attribute is never overridden by component-level `display` values (e.g., `display: flex` on `.custom-size-inputs`). All screen/element visibility toggles use the `hidden` property in JS.

## Cross-Cutting Concerns

- **Performance**: Iterative maze generation avoids stack overflow. BFS uses parent-pointer reconstruction to avoid path copying. Canvas redraw scoped to changed state (or full redraw kept under 16ms by simplicity of drawing).
- **Keyboard conflict prevention**: `preventDefault()` on arrow keys during PLAYING state to avoid page scroll.
- **Touch conflict prevention**: `preventDefault()` on touch events during PLAYING state to avoid scroll/zoom. `html.game-active` scroll lock prevents background scrolling during swipe.
- **Responsive canvas**: Canvas dimensions recalculated on window resize and orientation change, cell size recomputed, full redraw triggered.
- **Graceful degradation**: If localStorage is unavailable, catch errors silently — game functions without persistence. If JavaScript is unavailable, `<noscript>` message shown.
- **Distribution**: `build.sh` produces `amazeng.html` which is fully self-contained. `deploy.sh` publishes to GitHub Pages with cache-busting.
