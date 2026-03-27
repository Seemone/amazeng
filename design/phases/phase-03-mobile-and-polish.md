# Phase: Mobile and Polish

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

**Phase ID**: `PHASE-03`
**Requirements**: `design/requirements.md`
**Specifications**: `design/specifications.md`
**Implementation**: `design/implementation.md`
**Requirement Checklist**: `design/requirement-checklist.md`
**Phase Summary**: `design/summaries/phase-03-mobile-and-polish-summary.md`

### Phase Scope
- Features included: Abort game button with optimal path reveal, BFS shortest path computation, efficiency scoring (shortest/moves as percentage), optimal path rendering (magenta), scoreboard overhaul (efficiency ranking, maze size column), touch/swipe controls (continuous movement, direction change, wall stops), directional arrow indicator, responsive layout (6"+ screens), rebrand to "A-maze-ng", single-file build script
- Requirement IDs: `RQ-019`, `RQ-020`, `RQ-021`, `RQ-022`, `RQ-023`, `RQ-024`, `RQ-025`, `RQ-026`, `RQ-027`, `RQ-028`
- Deliverables: Updated `index.html` (abort screen markup, responsive meta, rebrand), updated `style.css` (responsive breakpoints, touch targets, abort screen, path styling), updated `game.js` (BFS, touch handler, efficiency scoring, abort flow, rebrand), new `build.sh`, generated `amazeng.html`
- Dependencies: `PHASE-02` (UI and scoring must be functional)

### Cross-References
- Requirements sections: `design/requirements.md#functional-requirements`
- Specifications sections: `design/specifications.md#component-design`, `design/specifications.md#cross-cutting-concerns`
- Parent implementation sections: `design/implementation.md#implementation-phases`
- Related phases: `design/phases/phase-01-core-engine.md`, `design/phases/phase-02-ui-and-scoring.md` (dependencies)

### Phase File Layout

| File | Responsibility | Key Functions | Entry Points |
| ---- | -------------- | ------------- | ------------ |
| `index.html` | Abort screen markup (overlay with "Back to Menu" button), viewport meta update (`user-scalable=no`), title rebrand to "A-maze-ng", abort button in game screen | N/A | Browser load |
| `style.css` | Responsive breakpoints (<768px), touch target sizing (min 44px), abort button styling, abort screen overlay, optimal path color variable, `touch-action: none` on canvas, mobile-friendly form layout | N/A | Linked from HTML |
| `game.js` | `findShortestPath` (BFS), `drawOptimalPath`, `drawDirectionArrow`, `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`, `showAbortScreen`, `revealAllCells`, efficiency calculation in `saveScore`, updated `refreshScoreboard` (efficiency + size columns), localStorage key prefix change to `amazeng_scores_*` | `findShortestPath`, `handleTouchStart`, `showAbortScreen`, `drawOptimalPath` | Touch events, abort button click |
| `build.sh` | POSIX shell script: reads `index.html`, inlines `style.css` content into `<style>` tag, inlines `game.js` content into `<script>` tag, writes `amazeng.html` | N/A | Manual: `sh build.sh` |

### Phase Data Changes

Updates localStorage schema:

- **Key format change**: `maze_scores_<W>x<H>_r<R>` → `amazeng_scores_<W>x<H>_r<R>`
- Old keys are NOT migrated — fresh start for scoreboard.
- **Value format change**: Entries gain `efficiency` and `size` fields:
  ```json
  { "efficiency": 87.3, "moves": 42, "size": "20x20", "date": "2026-03-27" }
  ```
- **Sort order change**: Descending by `efficiency`, then ascending by `moves` (was: ascending by `moves` only)
- Read on: scoreboard view, win screen (personal best check)
- Write on: game win (insert if qualifies for top 10)
- Error handling: try/catch around all localStorage access — degrade gracefully

### Phase GameState Changes

New fields added to `gameState`:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `optimalPath` | `[{row, col}]` | BFS shortest path from start to exit, computed at generation |
| `optimalPathLength` | `int` | Number of steps (cells - 1) in the optimal path |
| `state` | `string` | Adds `"abort"` to existing `"start"`, `"playing"`, `"win"` values |

### Phase Touch Input Design

**Swipe detection**:
- `touchstart`: Record initial touch coordinates, set `touchActive = true`
- `touchmove`: Compute delta from last position. If delta > 20px threshold, determine dominant direction (horizontal vs vertical). If direction changed, clear previous movement interval and start new one. Update reference coordinates.
- `touchend`: Clear movement interval, set `touchActive = false`

**Continuous movement**:
- On direction detection, execute immediate move, then start `setInterval` at ~150ms for repeated moves
- Wall collision stops the current move but does NOT cancel the interval — if the player changes swipe direction, movement continues in the new direction
- Each interval tick calls `attemptMove(direction)` which checks walls before moving

**Direction arrow**:
- Small filled triangle (6-8px) drawn at the edge of the player circle in the movement direction
- Same color as player (`--color-player`) with subtle glow
- Drawn only while `touchActive` is true and `lastDirection` is set

### Phase Rendering Changes

**Optimal path rendering** (win and abort states):
- After drawing walls but before drawing exit/player markers
- Iterate `optimalPath` array, draw centered magenta (`--color-path` / `--color-wall-alt`) filled squares (50% of cell size) with `shadowBlur: 6`
- Full fog lifted: all cells drawn regardless of `revealed` state

**Abort button**:
- Positioned in the HUD area or as a fixed-position button on mobile
- During PLAYING state only
- Styled as a subtle secondary button so it doesn't distract from gameplay

### Phase Responsive Layout Changes

**Breakpoint**: 768px width

**Below 768px (mobile)**:
- Start screen: stack settings vertically, full-width buttons, min 44px tap targets
- Canvas: `width: calc(100vw - 16px)`, height proportional to maze aspect ratio
- HUD: above canvas, larger text
- Abort button: larger tap target, semi-transparent background
- Win/abort overlays: full-viewport, larger font sizes, stacked buttons
- Scoreboard table: smaller font, compact layout
- `touch-action: none` on canvas element to prevent browser gestures

**Above 768px (desktop)**:
- No changes to existing layout
- Touch handlers still active (for touchscreen laptops) but swipe arrow hidden when using keyboard

### Phase Testing Requirements

- **Abort**: Click abort during gameplay → full maze revealed with magenta optimal path → "Back to Menu" returns to start screen. Verify no score is saved on abort.
- **BFS path**: On small mazes (2x2, 3x3, 5x5), visually verify the magenta path is the shortest route.
- **Efficiency score**: Complete a maze, verify efficiency = (optimal steps / player moves) * 100. On a trivial maze where optimal is taken, verify 100%.
- **Scoreboard**: Verify new sort order (highest efficiency first). Verify table shows efficiency %, moves, and maze size columns. Verify old `maze_scores_*` keys are ignored.
- **Touch/swipe**: On mobile or touch emulator — swipe right → player moves right. Hold swipe → continuous movement. Change direction mid-swipe → direction changes. Swipe into wall → movement stops. Verify directional arrow appears during swipe.
- **Responsive**: Test at 375px (phone), 768px (tablet), 1200px (desktop). Verify start screen forms are usable, buttons are tappable, canvas scales properly.
- **Rebrand**: Page title shows "A-maze-ng". Start screen heading shows "A-maze-ng". No references to "Maze Explorer" remain.
- **Build script**: Run `sh build.sh` → produces `amazeng.html`. Open it → game functions identically to `index.html`. Verify file is self-contained (no external references).
- **Cross-browser**: Chrome, Firefox, Safari, Edge desktop. Mobile Safari, Chrome on Android.
