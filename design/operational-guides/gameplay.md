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

### Covered Requirement Tags
- `guide:gameplay`

### Covered Requirement IDs
- `RQ-001` — Size selection (presets + custom)
- `RQ-002` — Visibility radius selection
- `RQ-005` — Exit always visible through fog
- `RQ-006` — Fog of war at game start
- `RQ-007` — Visibility radius reveal (Manhattan distance)
- `RQ-008` — Arrow key and WASD movement
- `RQ-009` — Wall collision does not count as move
- `RQ-010` — Move counter display
- `RQ-011` — Win on reaching exit
- `RQ-012` — Win screen with score and navigation
- `RQ-013` — Scoreboard in localStorage (top 10 per config)
- `RQ-014` — Scoreboard viewable from start screen
- `RQ-018` — Custom size capped at 80x80

### Interfaces and Usage

#### Start Screen
- **Size presets**: Small (10x10), Medium (20x20), Large (40x40) — radio buttons or similar selector
- **Custom size**: Width and height number inputs, visible when Custom is selected. Values must be 1–80.
- **Visibility radius**: Slider or dropdown, range 1–5, default 2
- **Start button**: Validates inputs, generates maze, transitions to PLAYING state
- **Scoreboard link**: Opens scoreboard view for the currently selected configuration

#### Gameplay
- **Controls**: Arrow keys (Up/Down/Left/Right) and WASD. One keypress = one cell move.
- **Wall collision**: Pressing toward a wall has no effect, move counter does not increment.
- **Fog of war**: All cells hidden at start. Player movement reveals cells within visibility radius (Manhattan distance). Reveal is permanent.
- **Exit beacon**: Visible at all times through fog. Gold/orange glow effect. Player navigates toward it.
- **Move counter**: Displayed as HUD on or near the canvas. Updates on each successful move.

#### Win Screen
- Triggered when player enters the exit cell
- Displays: move count, "New best!" if it's a top-10 score for this configuration
- Buttons: "Play Again" (same settings), "Back to Menu" (return to start screen)

#### Scoreboard
- Top 10 scores per configuration (size + radius combination)
- Each entry: move count and date
- Sorted ascending by move count (lower = better)
- Persisted in localStorage, key format: `maze_scores_<W>x<H>_r<R>`

### Configuration

- **Size presets**: Hardcoded in HTML/JS. To add/change presets, modify the start screen markup and the corresponding JS mapping.
- **Visibility radius range**: 1–5 hardcoded. Adjustable in JS constants.
- **Max custom size**: 80x80 hardcoded. Adjustable in JS validation logic.
- **Scoreboard capacity**: 10 entries per config. Adjustable in score manager.

### Verification and Smoke Tests

- Select each size preset → start game → verify grid dimensions match
- Enter custom size 15x25 → verify non-square maze works
- Enter custom size 0 or 81 → verify validation error appears
- Set radius to 1 → verify tight visibility (only adjacent cells)
- Set radius to 5 → verify wide visibility area
- Play to completion → verify win screen appears with correct move count
- Check scoreboard → verify score was saved
- Reload page → verify score persists
- Play same config again with more moves → verify ordering is correct
- Play different config → verify separate scoreboard

### Monitoring and Failure Modes

- **localStorage full**: `QuotaExceededError` caught by try/catch. Game continues, score not saved. No user-visible error (silent degradation).
- **localStorage disabled**: Same graceful degradation — game plays normally without persistence.
- **Invalid form input**: Inline error messaging prevents game start until corrected.

### Rollback and Recovery

- **Scoreboard corruption**: If localStorage data is corrupted, clearing the specific key (or all site data) resets the scoreboard. Game remains functional.
- **Clear all scores**: User can clear via browser devtools (Application → Local Storage) or a future "Clear Scores" button if desired.
