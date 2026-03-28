# Operational Guide: Gameplay

## Resolved Document Set
- Requirements: `design/requirements.md`
- Specifications: `design/specifications.md`
- Implementation: `design/implementation.md`
- Requirement Checklist: `design/requirement-checklist.md`
- Guide Topic: `gameplay`
- Guide Path: `design/operational-guides/gameplay.md`
- Covered Phases:
  - `PHASE-01`: `design/phases/phase-01-core-engine.md`
  - `PHASE-02`: `design/phases/phase-02-ui-and-scoring.md`
  - `PHASE-03`: `design/phases/phase-03-mobile-and-polish.md`

### Covered Requirement Tags
- `guide:gameplay`

### Covered Requirement IDs
- `RQ-001` — Size selection (presets + custom) — **Phase 2 Complete**
- `RQ-002` — Visibility radius selection — **Phase 2 Complete**
- `RQ-005` — Exit always visible through fog — **Phase 1 Complete**
- `RQ-006` — Fog of war at game start — **Phase 1 Complete**
- `RQ-007` — Visibility radius reveal (Manhattan distance) — **Phase 1 Complete**
- `RQ-008` — Arrow key and WASD movement — **Phase 1 Complete**
- `RQ-009` — Wall collision does not count as move — **Phase 1 Complete**
- `RQ-010` — Move counter display — **Phase 1 Complete**
- `RQ-011` — Win on reaching exit — **Phase 1 Complete**
- `RQ-012` — Win screen with score and navigation — **Phase 2 Complete**
- `RQ-013` — Scoreboard in localStorage (top 10 per config) — **Phase 2 Complete**
- `RQ-014` — Scoreboard viewable from start screen — **Phase 2 Complete**
- `RQ-018` — Custom size capped at 80x80 — **Phase 2 Complete**
- `RQ-019` — Abort game with path reveal — **Phase 3 Complete**
- `RQ-020` — BFS shortest path computation — **Phase 3 Complete**
- `RQ-021` — Optimal path visualization (magenta) — **Phase 3 Complete**
- `RQ-022` — Efficiency score (shortest/moves as %) — **Phase 3 Complete**
- `RQ-023` — Scoreboard ranked by efficiency — **Phase 3 Complete**
- `RQ-024` — Touch/swipe controls — **Phase 3 Complete**
- `RQ-025` — Directional arrow indicator — **Phase 3 Complete**
- `RQ-026` — Responsive layout (6"+ screens) — **Phase 3 Complete**
- `RQ-027` — Rebrand to "A-maze-ng" — **Phase 3 Complete**

### Interfaces and Usage

#### Start Screen (Phase 2 — Implemented)
- **Size presets**: Four buttons — Small (10x10), Medium (20x20), Large (40x40), Custom. Only one selected at a time (exclusive toggle). Medium selected by default.
- **Custom size**: Clicking "Custom" reveals width/height number inputs (min 2, max 80). Invalid values show inline red error text, game does not start.
- **Visibility radius**: Range slider (1-5, default 2) with live `<output>` display showing current value.
- **Start Game**: Validates settings, then calls `initGame(width, height, radius)`. Transitions to PLAYING state.
- **View Scoreboard**: Navigates to scoreboard screen.

#### Gameplay (Phase 1 — Implemented)
- **Controls (desktop)**: Arrow keys (Up/Down/Left/Right) and WASD. One keypress = one cell move. `preventDefault()` blocks page scroll during gameplay.
- **Wall collision**: Moving toward a wall has no effect; move counter does not increment. Wall presence checked via `grid[row][col].walls[direction]`.
- **Fog of war**: All cells start with `revealed: false`. Player movement reveals cells within visibility radius using Manhattan distance (`|dr| + |dc| <= radius`). Reveal is permanent.
- **Exit beacon**: Drawn unconditionally in `render()` regardless of `revealed` state. Gold/orange circle with strong `shadowBlur: 20` glow.
- **Move counter**: Displayed in `<section class="hud" id="hud">` with `aria-live="polite"`. Updated on each successful move via `render()`.
- **Win detection**: `checkWin()` triggers when `playerRow === exitRow && playerCol === exitCol`. Saves score, transitions state to `"win"`, shows win overlay.

#### Touch Controls (Phase 3 — Implemented)
- **Swipe to move**: Touch and drag on the canvas. Dominant direction (horizontal/vertical) determines movement direction. Threshold: 20px minimum displacement.
- **Continuous movement**: While finger is held, player moves repeatedly (~150ms interval). No need to lift and re-swipe.
- **Direction change**: Changing swipe direction mid-drag immediately switches movement direction. Previous interval cleared, new one started.
- **Wall stops**: If the player hits a wall, movement stops but the swipe remains active. Changing direction resumes movement.
- **Directional arrow**: Small filled triangle drawn at the edge of the player circle in the current movement direction. Green with subtle glow. Only visible during active swipe (`touchActive && lastDirection !== null`).

#### Abort (Phase 3 — Implemented)
- **Abort button**: In HUD next to move counter during PLAYING state. Styled as subtle secondary button with hover highlight in red.
- **Abort flow**: Click abort → `showAbortScreen()` → state changes to `"abort"` → `revealAllCells()` → `render()` draws full maze + magenta optimal path → abort overlay shows path length and move count → "Back to Menu" button.
- **No score saved**: Aborting does not call `saveScore()`.
- **Back to Menu**: Calls `showStartScreen()`, returns to start screen.

#### Win Screen (Phase 2+3 — Implemented)
- **Efficiency score**: Displays "Efficiency: X.X%" = (optimal path / moves) * 100.
- **Move count**: Displays "Moves: N".
- **Optimal path length**: Displays "Optimal path: N steps".
- **Optimal path visualization**: Full maze revealed via `revealAllCells()`, magenta path drawn by `drawOptimalPath()` behind the overlay.
- **Personal best**: "New Personal Best!" shown in gold when the score is the best for that config.
- **Play Again**: Starts a new game with the same settings.
- **Back to Menu**: Returns to start screen.

#### Scoreboard (Phase 2+3 — Implemented)
- **Configuration selector**: Dropdown for size (10x10, 20x20, 40x40) and radius (1-5). Scores refresh on change.
- **Score table columns**: Rank, efficiency %, moves, maze size, date.
- **Sort order**: Highest efficiency descending, then fewest moves ascending.
- **localStorage key format**: `amazeng_scores_<W>x<H>_r<R>` (fresh start — old `maze_scores_*` keys unused).
- **Storage format**: Entries include `efficiency`, `moves`, `size`, `date`.
- **Back to Menu**: Returns to start screen.

### Configuration

- **Maze size**: Selected via start screen presets or custom inputs. Range: 2-80 per dimension.
- **Visibility radius**: Selected via start screen slider. Range: 1-5, default 2.
- **Max custom size**: 80x80, enforced by `validateSettings()`.
- **Scoreboard capacity**: 10 entries per config key.
- **Settings persistence**: Current game settings preserved in `currentSettings` for Play Again.
- **Swipe threshold** (Phase 3): 20px minimum displacement before direction is registered.
- **Movement repeat rate** (Phase 3): ~150ms interval for continuous swipe movement.

### State Machine

```
START_SCREEN ──[Start Game]──> PLAYING ──[Reach Exit]──> WIN_SCREEN
     ^                            │                          │
     │                        [Abort]                        │
     │                            v                          │
     │                      ABORT_SCREEN                     │
     │                            │                          │
     └──[Back to Menu]────────────┘──────────────────────────┘
                                                             │
                  PLAYING <────────[Play Again]──────────────┘
```

### Verification and Smoke Tests

Phase 1 tests (manual):
- Load page — start screen appears with title and settings
- Start a game — maze renders, player and exit visible, HUD shows "Moves: 0"
- Arrow keys and WASD — player moves, counter increments, fog reveals
- Wall collision — nothing happens, counter unchanged
- Exit beacon — visible from start regardless of fog
- Reach exit — win overlay appears

Phase 2 tests (manual):
- Size presets — all four render, selection toggles correctly
- Custom size — inputs appear, validation rejects 0, -5, 81
- Radius slider — output updates, game uses selected radius
- Win screen — move count, personal best indicator, Play Again, Back to Menu
- Scoreboard — scores persist across reloads, isolated per config, top 10

Phase 3 tests (manual):
- Abort — button visible during gameplay, reveals full maze + magenta path, "Back to Menu" works, no score saved
- BFS path — visually correct shortest path on small mazes
- Efficiency — displayed as percentage on win screen, 100% for optimal play
- Scoreboard — sorted by efficiency desc, shows efficiency/moves/size columns, uses `amazeng_scores_*` keys
- Swipe — continuous movement, direction change mid-swipe, wall stops, arrow indicator
- Responsive — usable at 375px, 768px, 1200px widths
- Rebrand — "A-maze-ng" in title and heading, no "Maze Explorer" references
- Build — `sh build.sh` produces working `amazeng.html`

### Monitoring and Failure Modes

- **localStorage full**: `QuotaExceededError` caught by try/catch. Game continues, score not saved.
- **localStorage disabled**: Same graceful degradation. `loadScores()` returns `[]`, `saveScore()` silently fails.
- **Invalid form input**: Inline red error message prevents game start.
- **NaN/non-integer input**: Caught by `validateSettings()`.
- **Touch conflicts**: `preventDefault()` on touch events + `touch-action: none` CSS prevents browser zoom/scroll during gameplay.
- **BFS performance**: Should complete in <100ms for 80x80. If slow, check for path-copy implementation (use parent pointers instead).

### Rollback and Recovery

- **Scoreboard corruption**: Clear the specific localStorage key to reset. Game remains functional.
- **Clear all scores**: `localStorage.clear()` in browser console.
- **Old scores**: Previous `maze_scores_*` keys remain in localStorage but are unused after Phase 3 rebrand. Can be manually cleared if desired.
