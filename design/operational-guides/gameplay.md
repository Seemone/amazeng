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
- `RQ-001` — Size selection (presets + custom) — Phase 2
- `RQ-002` — Visibility radius selection — Phase 2
- `RQ-005` — Exit always visible through fog — **Phase 1 Complete**
- `RQ-006` — Fog of war at game start — **Phase 1 Complete**
- `RQ-007` — Visibility radius reveal (Manhattan distance) — **Phase 1 Complete**
- `RQ-008` — Arrow key and WASD movement — **Phase 1 Complete**
- `RQ-009` — Wall collision does not count as move — **Phase 1 Complete**
- `RQ-010` — Move counter display — **Phase 1 Complete**
- `RQ-011` — Win on reaching exit — **Phase 1 Complete**
- `RQ-012` — Win screen with score and navigation — Phase 2
- `RQ-013` — Scoreboard in localStorage (top 10 per config) — Phase 2
- `RQ-014` — Scoreboard viewable from start screen — Phase 2
- `RQ-018` — Custom size capped at 80x80 — Phase 2

### Interfaces and Usage

#### Gameplay (Phase 1 — Implemented)
- **Controls**: Arrow keys (Up/Down/Left/Right) and WASD. One keypress = one cell move. `preventDefault()` blocks page scroll during gameplay.
- **Wall collision**: Moving toward a wall has no effect; move counter does not increment. Wall presence checked via `grid[row][col].walls[direction]`.
- **Fog of war**: All cells start with `revealed: false`. Player movement reveals cells within visibility radius using Manhattan distance (`|dr| + |dc| <= radius`). Reveal is permanent.
- **Exit beacon**: Drawn unconditionally in `render()` regardless of `revealed` state. Gold/orange circle with strong `shadowBlur: 20` glow.
- **Move counter**: Displayed in `<section class="hud" id="hud">` with `aria-live="polite"`. Updated on each successful move via `render()`.
- **Win detection**: `checkWin()` triggers when `playerRow === exitRow && playerCol === exitCol`. Transitions state to `"win"`, shows overlay.

#### Start Screen (Phase 2 — Not Yet Implemented)
- Size presets, custom size, visibility radius, start button, scoreboard link

#### Win Screen (Phase 1 — Partial)
- Shows move count and "Play Again" button
- Phase 2 will add: personal best indication, "Back to Menu" button, score persistence

#### Scoreboard (Phase 2 — Not Yet Implemented)
- localStorage persistence, top 10 per config, viewable from start screen

### Configuration

- **Maze size**: Hardcoded `MAZE_WIDTH = 20`, `MAZE_HEIGHT = 20` in Phase 1. Phase 2 adds settings UI.
- **Visibility radius**: Hardcoded `VISIBILITY_RADIUS = 2` in Phase 1. Phase 2 adds 1–5 selection.
- **Max custom size**: 80x80, enforced in Phase 2 validation.
- **Scoreboard capacity**: 10 entries per config, implemented in Phase 2.

### Verification and Smoke Tests

Phase 1 tests (manual):
- Load page — maze renders immediately, player (green) and exit (gold) visible
- Press arrow keys and WASD — player moves one cell per keypress
- Move into wall — nothing happens, move counter unchanged
- Move into open passage — player moves, counter increments, fog reveals
- Observe fog — diamond-shaped reveal around player, unrevealed areas are black
- Exit beacon — visible from game start regardless of fog state
- Reach exit — win overlay appears with move count and Play Again button
- Click Play Again — new maze generated, game restarts

### Monitoring and Failure Modes

- **localStorage full**: `QuotaExceededError` caught by try/catch (Phase 2). Game continues, score not saved.
- **localStorage disabled**: Same graceful degradation (Phase 2).
- **Invalid form input**: Inline error messaging prevents game start (Phase 2).

### Rollback and Recovery

- **Scoreboard corruption** (Phase 2): Clearing localStorage key resets scoreboard. Game remains functional.
