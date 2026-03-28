# Phase Summary: Mobile and Polish

## Resolved Document Set
- Requirements: `design/requirements.md`
- Specifications: `design/specifications.md`
- Implementation: `design/implementation.md`
- Requirement Checklist: `design/requirement-checklist.md`
- Phase ID: `PHASE-03`
- Phase Document: `design/phases/phase-03-mobile-and-polish.md`
- Phase Summary: `design/summaries/phase-03-mobile-and-polish-summary.md`
- Operational Guides:
  - `general`: `design/operational-guides/general.md`
  - `gameplay`: `design/operational-guides/gameplay.md`

### Summary Scope
- Phase ID: `PHASE-03`
- Requirement IDs completed: `RQ-019`, `RQ-020`, `RQ-021`, `RQ-022`, `RQ-023`, `RQ-024`, `RQ-025`, `RQ-026`, `RQ-027`, `RQ-028`, `RQ-029`, `RQ-030`, `RQ-031`, `RQ-032`
- Operational guide topics touched: `gameplay`, `general`

### What Changed

#### BFS Shortest Path (RQ-020)
- Added `findShortestPath()` using BFS with parent-pointer reconstruction (O(W*H) time and memory)
- Computed at maze generation time in `initGame()`, stored as `gameState.optimalPath` and `gameState.optimalPathLength`

#### Abort Game Flow (RQ-019)
- Added abort button in HUD (visible during PLAYING state)
- `showAbortScreen()` sets state to `"abort"`, reveals all cells, renders full maze with optimal path, shows abort overlay
- "Back to Menu" returns to start screen — no score saved on abort

#### Optimal Path Visualization (RQ-021)
- `drawOptimalPath()` renders magenta filled squares (50% cell size) with `shadowBlur: 6` along the BFS path
- Drawn on both win and abort screens after all fog is lifted

#### Efficiency Scoring (RQ-022)
- Efficiency = `(optimalPathLength / moveCount) * 100`, displayed as percentage to one decimal place
- Shown on win screen with optimal path length and move count

#### Scoreboard Overhaul (RQ-023)
- localStorage key format changed from `maze_scores_*` to `amazeng_scores_*` (fresh start)
- Score entries now include `efficiency`, `moves`, `size`, `date`
- Sort order: highest efficiency descending, then fewest moves ascending
- Table columns: rank, efficiency %, moves, maze size, date

#### Touch/Swipe Controls (RQ-024)
- Touch event handlers on canvas: `touchstart`, `touchmove`, `touchend` with `{ passive: false }`
- Swipe threshold: 20px minimum displacement
- Continuous movement via `setInterval` at 150ms
- Direction change mid-swipe clears old interval, starts new one
- Wall collision stops current move but keeps interval active

#### Directional Arrow (RQ-025)
- `drawDirectionArrow()` renders a filled triangle at the edge of the player circle
- Points in the current movement direction, same color as player with subtle glow
- Only drawn while `touchActive` is true and `lastDirection` is set

#### Responsive Layout (RQ-026)
- CSS media query at `max-width: 767px` for mobile
- Stacked layout: vertical preset buttons, full-width action buttons, 44px min tap targets
- Canvas fills viewport width minus padding
- Overlay screens full-viewport with stacked buttons

#### Rebrand (RQ-027)
- Page title: "A-maze-ng"
- Start screen heading: "A-maze-ng"
- CSS comment updated
- JS comment updated
- localStorage keys use `amazeng_scores_*` prefix

#### Build Script (RQ-028)
- `build.sh`: POSIX shell script using `while read` loop
- Replaces `<link>` with inlined `<style>` and `<script src>` with inlined `<script>`
- Produces `amazeng.html` (self-contained, ~36KB)

### Design Decisions and Deviations
- Used shared `.overlay` CSS class for both win and abort screens (spec had separate `.win-overlay`)
- BFS uses parent-pointer Map with string keys (`"row,col"`) for efficient reconstruction
- `attemptMove()` extracted as shared function for both keyboard and touch input
- HUD updated to use flex layout with separate `#hud-moves` span and abort button
- Build script uses shell `while read` instead of `awk`/`sed` for multiline reliability

### Public Interfaces and Contracts
- New functions: `findShortestPath()`, `drawOptimalPath()`, `drawDirectionArrow()`, `attemptMove()`, `handleTouchStart()`, `handleTouchMove()`, `handleTouchEnd()`, `showAbortScreen()`, `revealAllCells()`, `clearTouchState()`, `dominantDirection()`, `setupSquareCheckbox()`, `setupControlsHint()`, `lockScroll()`, `unlockScroll()`
- Updated functions: `render()` (shows all cells + path on win/abort), `saveScore()` (efficiency parameter), `showWinScreen()` (efficiency + optimal path params, unlocks scroll), `refreshScoreboard()` (new columns), `initGame()` (BFS computation), `setup()` (touch listeners, abort/resize handlers, square checkbox, controls hint), `showGameScreen()` (locks scroll), `showStartScreen()` (unlocks scroll), `hideAllScreens()` (resets abort btn + hint visibility)

### Data Model Changes
- `gameState` gains: `optimalPath`, `optimalPathLength`
- `gameState.state` gains `"abort"` value
- localStorage entry format: `{ efficiency, moves, size, date }`
- localStorage key prefix: `amazeng_scores_*`

### Requirement Checklist Updates

| Requirement ID | Implementation Status | Test Status | Validating Tests | Notes |
| -------------- | --------------------- | ----------- | ---------------- | ----- |
| RQ-019 | Complete | Pending Manual | Manual: abort button → full maze + magenta path → Back to Menu | Abort overlay with info text |
| RQ-020 | Complete | Pending Manual | Manual: BFS path correctness on small mazes | Parent-pointer BFS in `findShortestPath()` |
| RQ-021 | Complete | Pending Manual | Manual: magenta path on win and abort screens | `drawOptimalPath()` with magenta + glow |
| RQ-022 | Complete | Pending Manual | Manual: efficiency % calculation and display | Displayed on win screen to 1 decimal |
| RQ-023 | Complete | Pending Manual | Manual: scoreboard efficiency sorting + columns | 5 columns, efficiency-first sort |
| RQ-024 | Complete | Pending Manual | Manual: swipe movement on mobile | Continuous movement with 150ms interval |
| RQ-025 | Complete | Pending Manual | Manual: directional arrow during swipe | Triangle at player edge in swipe direction |
| RQ-026 | Complete | Pending Manual | Manual: responsive layout at 375px, 768px, 1200px | 767px breakpoint, 44px tap targets |
| RQ-027 | Complete | Pending Manual | Manual: rebrand title + localStorage keys | "A-maze-ng" everywhere, `amazeng_scores_*` |
| RQ-028 | Complete | Pending Manual | Manual: build.sh + deploy.sh produce and publish | build.sh ~39KB; deploy.sh cache-busts + pushes |
| RQ-029 | Complete | Pending Manual | Manual: range sliders, square checkbox syncs dimensions | Sliders 2-80, square default on hides height |
| RQ-030 | Complete | Pending Manual | Manual: touch → "Drag to move", desktop → "Use WASD..." | Touch detection via ontouchstart/maxTouchPoints |
| RQ-031 | Complete | Pending Manual | Manual: results below canvas, page scrollable after game | Overlays are inline flow inside game-screen |
| RQ-032 | Complete | Pending Manual | Manual: no scroll during play, scroll after win/abort | html.game-active class, iOS scrollTo nudge |

### Risks, Deviations, and Follow-up
- Touch event handling may require tuning of swipe threshold and movement repeat rate on real devices
- Build script tested on macOS — Windows users would need WSL or equivalent
- Old scoreboard data under `maze_scores_*` keys will remain in localStorage but be unused
- `user-scalable=no` in viewport meta may be considered an accessibility concern on some platforms
