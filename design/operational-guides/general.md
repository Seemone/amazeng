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

- **Maze generation** (`generateMaze(width, height)`): Iterative stack-based recursive backtracker. Returns a 2D grid of cell objects with wall booleans. Produces a perfect maze (all cells reachable, no loops). Called once per game start in `initGame()`.
- **Canvas rendering** (`render()`): Full redraw on each player move. Draw order: black fill, revealed walls (cyan neon + `shadowBlur: 8`), exit beacon (gold + `shadowBlur: 20`), player (green + `shadowBlur: 12`), HUD text update.
- **Cell scaling** (`calculateCellSize()`): `Math.floor(Math.min(viewportW - 40, viewportH - 100) / Math.max(gridWidth, gridHeight))`. Canvas element resized to `cellSize * grid` dimensions. Recalculated on window resize.

### Configuration

- **Color palette**: Defined as CSS custom properties in `style.css` (`:root` block). JS reads them at init via `getComputedStyle`. Change `--color-wall`, `--color-exit`, `--color-player` to retheme.
- **Canvas size**: Computed dynamically from viewport minus padding. Canvas `width`/`height` attributes set in JS; CSS keeps it `display: block`.
- **Maze constants**: `MAZE_WIDTH`, `MAZE_HEIGHT`, `VISIBILITY_RADIUS` hardcoded at top of IIFE in `game.js`. Will be replaced by settings UI in Phase 2.

### Verification and Smoke Tests

- Load `index.html` in browser — canvas appears with black background, neon cyan walls glowing, gold exit beacon, green player dot
- Start a game — maze walls render with glow, fog hides unexplored areas
- Resize browser window — canvas and cell sizes adapt, full redraw occurs
- Generate several mazes (refresh page) — each is visually different
- Verify no console errors in browser devtools

### Monitoring and Failure Modes

- **Console errors**: Check browser dev console for JS errors on load and during gameplay.
- **Rendering artifacts**: Sub-pixel lines on large mazes — mitigated by `Math.floor` in cell size calculations.
- **Performance**: If canvas redraw feels sluggish on 80x80 (when enabled), profile `render()` in browser devtools.
- **CSS property read failure**: Falls back to hardcoded hex values in `COLORS` object.

### Rollback and Recovery

- No server, no deployment pipeline. "Rollback" means reverting file changes in version control.
- No persistent state at risk in this guide's scope (localStorage is covered by the `gameplay` guide).
