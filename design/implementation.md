# Implementation Plan: A-maze-ng

## Resolved Document Set
- Requirements: `design/requirements.md`
- Specifications: `design/specifications.md`
- Implementation: `design/implementation.md`
- Requirement Checklist: `design/requirement-checklist.md`
- Phase Documents:
  - `PHASE-01`: `design/phases/phase-01-core-engine.md`
  - `PHASE-02`: `design/phases/phase-02-ui-and-scoring.md`
  - `PHASE-03`: `design/phases/phase-03-mobile-and-polish.md`
- Phase Summaries:
  - `PHASE-01`: `design/summaries/phase-01-core-engine-summary.md`
  - `PHASE-02`: `design/summaries/phase-02-ui-and-scoring-summary.md`
  - `PHASE-03`: `design/summaries/phase-03-mobile-and-polish-summary.md`
- Operational Guides:
  - `general`: `design/operational-guides/general.md`
  - `gameplay`: `design/operational-guides/gameplay.md`

**Requirements**: `design/requirements.md`
**Specifications**: `design/specifications.md`
**Requirement Checklist**: `design/requirement-checklist.md`

### Objective & Constraints
- Primary goal: Deliver a self-contained browser puzzle game — procedurally generated maze with fog of war, keyboard and touch navigation, efficiency-based scoring, and a neon-on-black visual style. Playable on desktop and mobile, shareable as a single file.
- Technical constraints: Zero dependencies, no build step for development, Canvas 2D rendering, localStorage only. Must handle up to 80x80 grids without performance issues. BFS pathfinding must complete in under 100ms.
- Business constraints: None — personal project, no deadline.

### Module & File Layout

| File | Responsibility | Key Functions | Entry Points |
| ---- | -------------- | ------------- | ------------ |
| `index.html` | Page shell, canvas element, start/win/abort screen markup, touch-friendly meta | N/A | Browser load |
| `style.css` | Layout, UI styling, CSS custom properties for color palette, responsive breakpoints | N/A | Linked from HTML |
| `game.js` | All game logic | `generateMaze`, `findShortestPath`, `render`, `drawOptimalPath`, `handleKeydown`, `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`, `revealCells`, `checkWin`, `saveScore`, `loadScores`, `initGame`, `showStartScreen`, `showWinScreen`, `showAbortScreen` | `DOMContentLoaded` event |
| `build.sh` | Inlines CSS and JS into single HTML file | N/A | Manual shell execution |
| `amazeng.html` | Generated distribution file (not checked in) | N/A | Browser load |

### Data & Schema Notes

#### Models

```javascript
// Cell in the maze grid
// cell.walls = { top: true, right: true, bottom: true, left: true }
// cell.revealed = false

// GameState
// { grid, width, height, playerRow, playerCol, exitRow, exitCol,
//   moveCount, visibilityRadius, optimalPath, optimalPathLength, state }
```

#### Storage Schema

localStorage key: `amazeng_scores_<W>x<H>_r<R>`

Value: JSON array sorted descending by efficiency, then ascending by moves:
```json
[
  { "efficiency": 87.3, "moves": 42, "size": "20x20", "date": "2026-03-27" },
  { "efficiency": 73.1, "moves": 56, "size": "20x20", "date": "2026-03-26" }
]
```

Max 10 entries per key.

### Control Flow Pseudocode

#### Game Initialization
```
on DOMContentLoaded:
  setupCanvas()
  setupTouchListeners()
  showStartScreen()

on Start button click:
  width, height = getSelectedSize()
  radius = getSelectedRadius()
  validate(width, height, radius)
  grid = generateMaze(width, height)
  playerPos = randomCell()
  exitPos = randomCell(different from playerPos)
  optimalPath = findShortestPath(grid, playerPos, exitPos)
  optimalPathLength = optimalPath.length - 1  // steps, not cells
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
  preventDefault()
  attemptMove(direction)

on swipe (during PLAYING state):
  direction = dominantSwipeDirection(dx, dy)
  attemptMove(direction)

function attemptMove(direction):
  if wallBlocks(playerPos, direction): return
  playerPos += direction
  moveCount++
  revealCells(playerPos, radius)

  if playerPos == exitPos:
    state = WIN
    efficiency = (optimalPathLength / moveCount) * 100
    isBest = saveScore(efficiency, moveCount)
    revealAllCells()
    render()  // draws full maze + optimal path
    showWinScreen(moveCount, efficiency, optimalPathLength, isBest)
  else:
    render()
```

#### Abort Flow
```
on abort button click (during PLAYING state):
  state = ABORT
  revealAllCells()
  render()  // draws full maze + optimal path
  showAbortScreen()

on "Back to Menu" button click (during ABORT state):
  showStartScreen()
```

#### Rendering
```
function render():
  clearCanvas(black)

  showAll = (state == WIN or state == ABORT)

  for each cell in grid:
    if cell.revealed or showAll:
      drawWalls(cell, neonColor, glowEffect)

  if showAll:
    drawOptimalPath(optimalPath, magenta, glow)

  drawExitMarker(exitPos, gold, strongGlow)  // always drawn
  drawPlayer(playerPos, playerColor)

  if touchActive and state == PLAYING:
    drawDirectionArrow(playerPos, lastDirection)

  drawHUD(moveCount)
```

### Cross-Cutting Hooks
- **Keyboard**: Arrow keys and WASD mapped to directions. `preventDefault()` on arrows during gameplay.
- **Touch**: `touchstart`, `touchmove`, `touchend` events. `preventDefault()` to block scroll/zoom during gameplay.
- **Resize**: Window resize and `orientationchange` recalculate canvas dimensions and cell size, trigger full redraw.
- **Storage errors**: Wrapped in try/catch — game works without persistence.

### Implementation Phases

| Phase ID | Phase File | Phase Summary File | Goal | Requirement IDs | Dependencies |
| -------- | ---------- | ------------------ | ---- | --------------- | ------------ |
| `PHASE-01` | `design/phases/phase-01-core-engine.md` | `design/summaries/phase-01-core-engine-summary.md` | Playable maze: generation, rendering, movement, fog of war, win detection | `RQ-003`, `RQ-004`, `RQ-005`, `RQ-006`, `RQ-007`, `RQ-008`, `RQ-009`, `RQ-010`, `RQ-011`, `RQ-015`, `RQ-016`, `RQ-017` | None |
| `PHASE-02` | `design/phases/phase-02-ui-and-scoring.md` | `design/summaries/phase-02-ui-and-scoring-summary.md` | Start screen, win screen, settings UI, scoreboard, localStorage persistence | `RQ-001`, `RQ-002`, `RQ-012`, `RQ-013`, `RQ-014`, `RQ-018` | `PHASE-01` |
| `PHASE-03` | `design/phases/phase-03-mobile-and-polish.md` | `design/summaries/phase-03-mobile-and-polish-summary.md` | Abort game, BFS pathfinding, efficiency scoring, mobile touch/swipe, responsive layout, rebrand, build script | `RQ-019`, `RQ-020`, `RQ-021`, `RQ-022`, `RQ-023`, `RQ-024`, `RQ-025`, `RQ-026`, `RQ-027`, `RQ-028` | `PHASE-02` |

### Operational Guide Coverage

| Guide Topic | Guide File | Requirement IDs | Notes |
| ----------- | ---------- | --------------- | ----- |
| `gameplay` | `design/operational-guides/gameplay.md` | `RQ-001`, `RQ-002`, `RQ-005`, `RQ-006`, `RQ-007`, `RQ-008`, `RQ-009`, `RQ-010`, `RQ-011`, `RQ-012`, `RQ-013`, `RQ-014`, `RQ-018`, `RQ-019`, `RQ-020`, `RQ-021`, `RQ-022`, `RQ-023`, `RQ-024`, `RQ-025`, `RQ-026`, `RQ-027` | All gameplay-facing requirements |
| `general` | `design/operational-guides/general.md` | `RQ-003`, `RQ-004`, `RQ-015`, `RQ-016`, `RQ-017`, `RQ-028` | Internal/rendering requirements and build tooling |

### Testing Plan

- Manual browser testing — open `index.html`, play through mazes at each size preset and custom sizes.
- Verify maze solvability: every generated maze must have a path from start to exit (guaranteed by algorithm but visually confirm).
- Edge cases: 2x2 maze (trivial), 80x80 maze (performance), visibility radius 1 vs 5, custom size validation (0, negative, >80).
- Scoreboard: verify localStorage persistence across page reloads, verify per-config isolation, verify top-10 cap, verify efficiency sorting.
- BFS: verify optimal path is correct by visual inspection on small mazes. Verify path renders in magenta on win and abort.
- Touch: test swipe movement on mobile device or emulator. Verify continuous movement, direction change, wall stops.
- Responsive: test on 375px width (iPhone SE), 768px (tablet), 1920px (desktop).
- Abort: verify abort reveals full maze, shows optimal path, "Back to Menu" works.
- Efficiency score: verify calculation matches shortest_path / moves * 100. Verify 100% for perfect play on small maze.
- Build script: run `build.sh`, verify `amazeng.html` opens and functions identically.
- Cross-browser: test in Chrome, Firefox, Safari, Edge. Test mobile Safari and Chrome.

### Dependencies & Risks

- **No external dependencies.** All code is vanilla HTML/CSS/JS.
- **Risk**: Large maze generation could block the UI thread. Mitigation: iterative algorithm (not recursive), and 80x80 = 6400 cells is well within single-frame budget.
- **Risk**: Canvas scaling may produce sub-pixel artifacts on very large mazes. Mitigation: floor cell size calculations, use `imageSmoothingEnabled = false` if needed.
- **Risk**: BFS on 80x80 (6400 cells) could be slow. Mitigation: parent-pointer reconstruction instead of path copying keeps it O(n). Measured budget: <100ms.
- **Risk**: Touch events may conflict with browser scroll/zoom gestures. Mitigation: `preventDefault()` on all touch events during PLAYING state, `touch-action: none` CSS on canvas.
- **Risk**: Build script portability across shells. Mitigation: POSIX sh only, no bashisms.
