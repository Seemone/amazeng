# Operational Guide: General

## Resolved Document Set
- Requirements: `design/requirements.md`
- Specifications: `design/specifications.md`
- Implementation: `design/implementation.md`
- Requirement Checklist: `design/requirement-checklist.md`
- Guide Topic: `general`
- Guide Path: `design/operational-guides/general.md`
- Covered Phases:
  - `PHASE-01`: `design/phases/phase-01-core-engine.md`

### Covered Requirement Tags
- `[none -> general fallback]`

### Covered Requirement IDs
- `RQ-003` — Procedural maze generation
- `RQ-004` — Random player start position
- `RQ-015` — Vibrant neon visual style
- `RQ-016` — Canvas glow effects
- `RQ-017` — Dynamic cell scaling

### Interfaces and Usage

This guide covers internal engine concerns not directly exposed as user-facing gameplay features.

- **Maze generation**: Recursive backtracker (iterative stack implementation). Called once per game start. Produces a perfect maze (all cells connected, no loops).
- **Canvas rendering**: Full redraw on each player move. Draw order: black fill → revealed walls (neon + glow) → exit beacon → player → HUD.
- **Cell scaling**: `cellSize = min(canvasWidth, canvasHeight) / max(gridWidth, gridHeight)`. Recalculated on window resize.

### Configuration

- **Color palette**: Defined as CSS custom properties in `style.css` (`:root` block). Change `--color-wall`, `--color-exit`, `--color-player` to retheme.
- **Canvas size**: Set via CSS to fill viewport with padding. JS reads `canvas.width`/`canvas.height` for rendering calculations.

### Verification and Smoke Tests

- Load `index.html` in browser — canvas should appear with black background.
- Start a game — maze walls should render with neon glow.
- Resize browser window — canvas and cell sizes should adapt.
- Generate several mazes — each should be visually different.

### Monitoring and Failure Modes

- **Console errors**: Check browser dev console for JS errors on load and during gameplay.
- **Rendering artifacts**: Sub-pixel lines on large mazes — mitigate by flooring cell size calculations.
- **Performance**: If canvas redraw feels sluggish on 80x80, profile `render()` function in browser devtools.

### Rollback and Recovery

- No server, no deployment pipeline. "Rollback" means reverting file changes in version control.
- No persistent state at risk in this guide's scope (localStorage is covered by the `gameplay` guide).
