# Specifications: Maze Explorer

## System Context

### Technology Stack

| Layer | Technology | Rationale |
| ----- | ---------- | --------- |
| Markup | HTML5 | Semantic page shell, no framework needed |
| Styling | CSS3 | Layout, start/win screen UI, CSS custom properties for neon color palette |
| Logic | Vanilla JavaScript (ES2020+) | All game logic — no dependencies |
| Rendering | HTML Canvas 2D API | Performant grid rendering, native glow effects via `shadowBlur` |
| Persistence | localStorage | Browser-local scoreboard, no backend |

### Deployment Architecture

Static files served from any HTTP server or opened directly as `file://`. No build, no bundler, no server-side logic.

```
browsergame/
  index.html
  style.css
  game.js
```

## User Experience Architecture

### User Persona

**Casual puzzle player**: Opens a URL, wants to play immediately. No sign-up, no install. Expects intuitive keyboard controls and a clean modern look. Motivated by self-improvement (beating their own scores).

### User Journey

1. Load page → see start screen with game title and settings
2. Choose maze size and visibility radius → click Start
3. Navigate the maze using keyboard → fog reveals as they explore
4. Reach the exit → see score, personal best, option to replay or return to menu
5. Optionally view scoreboard from start screen

### Interaction Patterns

- **Input model**: Discrete keyboard events (keydown). One key = one move. No mouse interaction during gameplay.
- **Feedback**: Immediate visual update on every move (canvas redraws). Move counter updates in real time.
- **Orientation**: Exit marker always visible through fog — player always knows which direction to aim for.

### Error Experience

- Invalid custom size: inline message next to input fields, game does not start
- localStorage unavailable: game plays normally, scores silently not persisted

## Component Design

### Game State Machine

```
START_SCREEN ──[Start]──> PLAYING ──[Reach Exit]──> WIN_SCREEN
     ^                                                   │
     └──────────────[Back to Menu]───────────────────────┘
     ^                                                   │
     └──────────────[Play Again]─────> PLAYING ──────────┘
```

States:
- **START_SCREEN**: Settings UI visible. Canvas may show decorative background.
- **PLAYING**: Canvas renders maze, player, exit, fog. Keyboard input active. HUD shows move count.
- **WIN_SCREEN**: Overlay with score, personal best status, navigation buttons.

### Module Breakdown (within game.js)

| Module | Responsibility |
| ------ | -------------- |
| Maze Generator | Recursive backtracker algorithm, produces grid data structure |
| Grid Model | 2D cell array, wall states, revealed states, player/exit positions |
| Renderer | Canvas drawing — background, walls, fog, exit beacon, player, HUD |
| Input Handler | Keyboard event listener, movement validation, move counting |
| Fog Controller | Visibility radius logic, permanent cell reveal on movement |
| Score Manager | localStorage read/write, top-10 per config, personal best detection |
| UI Controller | Start screen, win screen, state transitions, settings form |

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
  state: "start" | "playing" | "win"
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
   - If revealed: draw open passages (dark), draw walls (neon color + shadowBlur glow)
   - If not revealed: skip (black background shows through)
3. Draw exit marker at exit cell position (always, regardless of revealed state). Gold/orange with strong shadowBlur glow.
4. Draw player marker at player cell position. Bright contrasting color.
5. Draw HUD: move counter text overlay.

### Cell Size Calculation

```
cellSize = min(canvasWidth, canvasHeight) / max(gridWidth, gridHeight)
```

Canvas sized to fill most of the viewport via CSS, with padding for HUD.

### Scoring & Persistence

**localStorage key format**: `maze_scores_<width>x<height>_r<radius>`

Example: `maze_scores_20x20_r2`

**Stored value**: JSON array of top 10 entries:
```
[
  { "moves": 142, "date": "2026-03-27" },
  { "moves": 156, "date": "2026-03-26" }
]
```

Sorted ascending by moves. On game win, insert if qualifies for top 10, trim to 10.

### Color Palette (CSS Custom Properties)

```css
:root {
  --color-bg: #000000;
  --color-wall: #00ffff;        /* cyan neon */
  --color-wall-alt: #ff00ff;    /* magenta neon — for variety or theming */
  --color-exit: #ffaa00;        /* warm gold/orange */
  --color-player: #00ff88;      /* electric green */
  --color-text: #ffffff;
  --color-glow: rgba(0, 255, 255, 0.6);
}
```

## Cross-Cutting Concerns

- **Performance**: Iterative maze generation avoids stack overflow. Canvas redraw scoped to changed state (or full redraw kept under 16ms by simplicity of drawing).
- **Keyboard conflict prevention**: `preventDefault()` on arrow keys during PLAYING state to avoid page scroll.
- **Responsive canvas**: Canvas dimensions recalculated on window resize, cell size recomputed, full redraw triggered.
- **Graceful degradation**: If localStorage is unavailable, catch errors silently — game functions without persistence.
