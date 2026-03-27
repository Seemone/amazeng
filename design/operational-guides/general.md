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
  - `PHASE-03`: `design/phases/phase-03-mobile-and-polish.md`

### Covered Requirement Tags
- `[none -> general fallback]`
- `guide:general`

### Covered Requirement IDs
- `RQ-003` — Procedural maze generation — **Phase 1 Complete**
- `RQ-004` — Random player start position — **Phase 1 Complete**
- `RQ-015` — Vibrant neon visual style — **Phase 1 Complete**
- `RQ-016` — Canvas glow effects — **Phase 1 Complete**
- `RQ-017` — Dynamic cell scaling — **Phase 1 Complete**
- `RQ-028` — Single-file build script — Phase 3

### Interfaces and Usage

- **Maze generation** (`generateMaze(width, height)`): Iterative stack-based recursive backtracker. Returns a 2D grid of cell objects with wall booleans. Produces a perfect maze (all cells reachable, no loops). Called once per game start in `initGame()`.
- **Canvas rendering** (`render()`): Full redraw on each player move. Draw order: black fill, revealed walls (cyan neon + `shadowBlur: 8`), optimal path if win/abort (magenta + `shadowBlur: 6`), exit beacon (gold + `shadowBlur: 20`), player (green + `shadowBlur: 12`), directional arrow if swiping, HUD text update.
- **Cell scaling** (`calculateCellSize()`): `Math.floor(Math.min(viewportW - padding, viewportH - padding) / Math.max(gridWidth, gridHeight))`. Canvas element resized to `cellSize * grid` dimensions. Recalculated on window resize and orientation change. On mobile (<768px), padding reduced to maximize canvas size.

### Configuration

- **Color palette**: Defined as CSS custom properties in `style.css` (`:root` block). JS reads them at init via `getComputedStyle`. Change `--color-wall`, `--color-exit`, `--color-player`, `--color-path` to retheme.
- **Canvas size**: Computed dynamically from viewport minus padding. Canvas `width`/`height` attributes set in JS; CSS keeps it `display: block`.
- **Maze constants**: Width, height, and visibility radius selected by user on start screen.

### Build Script (Phase 3)

- **Location**: `build.sh` in repository root
- **Usage**: `sh build.sh` from the repository root
- **Output**: `amazeng.html` — a single self-contained HTML file with all CSS inlined in a `<style>` tag and all JS inlined in a `<script>` tag
- **Purpose**: Produces a shareable file that can be sent via messaging apps and opened in any mobile browser
- **Dependencies**: POSIX sh, `sed`, `cat`, `wc` — no external tools
- **Regeneration**: Run after any change to `index.html`, `style.css`, or `game.js`
- **Git**: `amazeng.html` should be in `.gitignore` as a generated artifact

### Verification and Smoke Tests

- Load `index.html` in browser — start screen appears with "A-maze-ng" title
- Start a game — canvas appears with black background, neon cyan walls glowing, gold exit beacon, green player dot
- Resize browser window — canvas and cell sizes adapt, full redraw occurs
- Generate several mazes (start new games) — each is visually different
- Verify no console errors in browser devtools
- Run `sh build.sh` — `amazeng.html` produced, opens in browser identically to `index.html`

### Monitoring and Failure Modes

- **Console errors**: Check browser dev console for JS errors on load and during gameplay.
- **Rendering artifacts**: Sub-pixel lines on large mazes — mitigated by `Math.floor` in cell size calculations.
- **Performance**: If canvas redraw feels sluggish on 80x80, profile `render()` in browser devtools. BFS should complete in <100ms.
- **CSS property read failure**: Falls back to hardcoded hex values in `COLORS` object.
- **Build script failure**: Verify `index.html`, `style.css`, `game.js` exist in current directory. Check that `sed` syntax is compatible with current OS.

### Rollback and Recovery

- No server, no deployment pipeline. "Rollback" means reverting file changes in version control.
- No persistent state at risk in this guide's scope (localStorage is covered by the `gameplay` guide).
- Regenerate `amazeng.html` by re-running `build.sh` after any rollback.
