# Implementation Plan: Maze Explorer

## Resolved Document Set
- Requirements: `design/requirements.md`
- Specifications: `design/specifications.md`
- Implementation: `design/implementation.md`
- Requirement Checklist: `design/requirement-checklist.md`
- Phase Documents:
  - `PHASE-01`: `design/phases/phase-01-core-engine.md`
  - `PHASE-02`: `design/phases/phase-02-ui-and-scoring.md`
- Phase Summaries:
  - `PHASE-01`: `design/summaries/phase-01-core-engine-summary.md`
  - `PHASE-02`: `design/summaries/phase-02-ui-and-scoring-summary.md`
- Operational Guides:
  - `general`: `design/operational-guides/general.md`
  - `gameplay`: `design/operational-guides/gameplay.md`

**Requirements**: `design/requirements.md`
**Specifications**: `design/specifications.md`
**Requirement Checklist**: `design/requirement-checklist.md`

### Objective & Constraints
- Primary goal: Deliver a self-contained browser puzzle game — procedurally generated maze with fog of war, keyboard navigation, move-based scoring, and a neon-on-black visual style.
- Technical constraints: Zero dependencies, no build step, Canvas 2D rendering, localStorage only. Must handle up to 80x80 grids without performance issues.
- Business constraints: None — personal project, no deadline.

### Module & File Layout

| File | Responsibility | Key Functions | Entry Points |
| ---- | -------------- | ------------- | ------------ |
| `index.html` | Page shell, canvas element, start/win screen markup | N/A | Browser load |
| `style.css` | Layout, UI styling, CSS custom properties for color palette | N/A | Linked from HTML |
| `game.js` | All game logic | `generateMaze`, `render`, `handleKeydown`, `revealCells`, `checkWin`, `saveScore`, `loadScores`, `initGame`, `showStartScreen`, `showWinScreen` | `DOMContentLoaded` event |

### Data & Schema Notes

#### Models

```javascript
// Cell in the maze grid
// cell.walls = { top: true, right: true, bottom: true, left: true }
// cell.revealed = false

// GameState
// { grid, width, height, playerRow, playerCol, exitRow, exitCol,
//   moveCount, visibilityRadius, state }
```

#### Storage Schema

localStorage key: `maze_scores_<W>x<H>_r<R>`

Value: JSON array sorted ascending by moves:
```json
[
  { "moves": 142, "date": "2026-03-27" },
  { "moves": 156, "date": "2026-03-26" }
]
```

Max 10 entries per key.

### Control Flow Pseudocode

#### Game Initialization
```
on DOMContentLoaded:
  setupCanvas()
  showStartScreen()

on Start button click:
  width, height = getSelectedSize()
  radius = getSelectedRadius()
  validate(width, height, radius)
  grid = generateMaze(width, height)
  playerPos = randomCell()
  exitPos = randomCell(different from playerPos)
  revealCells(playerPos, radius)
  moveCount = 0
  state = PLAYING
  render()
```

#### Movement Loop
```
on keydown (during PLAYING state):
  direction = mapKeyToDirection(event.key)
  if direction is null: return
  preventDefault()  // stop page scroll

  targetRow, targetCol = playerPos + direction
  if wallBlocks(playerPos, direction): return  // no move counted

  playerPos = (targetRow, targetCol)
  moveCount++
  revealCells(playerPos, radius)

  if playerPos == exitPos:
    state = WIN
    saveScore(moveCount, width, height, radius)
    showWinScreen(moveCount)
  else:
    render()
```

#### Rendering
```
function render():
  clearCanvas(black)

  for each cell in grid:
    if cell.revealed:
      drawWalls(cell, neonColor, glowEffect)

  drawExitMarker(exitPos, gold, strongGlow)  // always drawn
  drawPlayer(playerPos, playerColor)
  drawHUD(moveCount)
```

### Cross-Cutting Hooks
- **Keyboard**: Arrow keys and WASD mapped to directions. `preventDefault()` on arrows during gameplay.
- **Resize**: Window resize recalculates canvas dimensions and cell size, triggers full redraw.
- **Storage errors**: Wrapped in try/catch — game works without persistence.

### Implementation Phases

| Phase ID | Phase File | Phase Summary File | Goal | Requirement IDs | Dependencies |
| -------- | ---------- | ------------------ | ---- | --------------- | ------------ |
| `PHASE-01` | `design/phases/phase-01-core-engine.md` | `design/summaries/phase-01-core-engine-summary.md` | Playable maze: generation, rendering, movement, fog of war, win detection | `RQ-003`, `RQ-004`, `RQ-005`, `RQ-006`, `RQ-007`, `RQ-008`, `RQ-009`, `RQ-010`, `RQ-011`, `RQ-015`, `RQ-016`, `RQ-017` | None |
| `PHASE-02` | `design/phases/phase-02-ui-and-scoring.md` | `design/summaries/phase-02-ui-and-scoring-summary.md` | Start screen, win screen, settings UI, scoreboard, localStorage persistence | `RQ-001`, `RQ-002`, `RQ-012`, `RQ-013`, `RQ-014`, `RQ-018` | `PHASE-01` |

### Operational Guide Coverage

| Guide Topic | Guide File | Requirement IDs | Notes |
| ----------- | ---------- | --------------- | ----- |
| `gameplay` | `design/operational-guides/gameplay.md` | `RQ-001`, `RQ-002`, `RQ-005`, `RQ-006`, `RQ-007`, `RQ-008`, `RQ-009`, `RQ-010`, `RQ-011`, `RQ-012`, `RQ-013`, `RQ-014`, `RQ-018` | All gameplay-facing requirements |
| `general` | `design/operational-guides/general.md` | `RQ-003`, `RQ-004`, `RQ-015`, `RQ-016`, `RQ-017` | Internal/rendering requirements without specific guide tag |

### Testing Plan

- Manual browser testing — open `index.html`, play through mazes at each size preset and custom sizes.
- Verify maze solvability: every generated maze must have a path from start to exit (guaranteed by algorithm but visually confirm).
- Edge cases: 1x1 maze (trivial), 80x80 maze (performance), visibility radius 1 vs 5, custom size validation (0, negative, >80).
- Scoreboard: verify localStorage persistence across page reloads, verify per-config isolation, verify top-10 cap.
- Cross-browser: test in Chrome, Firefox, Safari, Edge.

### Dependencies & Risks

- **No external dependencies.** All code is vanilla HTML/CSS/JS.
- **Risk**: Large maze generation could block the UI thread. Mitigation: iterative algorithm (not recursive), and 80x80 = 6400 cells is well within single-frame budget.
- **Risk**: Canvas scaling may produce sub-pixel artifacts on very large mazes. Mitigation: floor cell size calculations, use `imageSmoothingEnabled = false` if needed.
