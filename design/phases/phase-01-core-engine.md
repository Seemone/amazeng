# Phase: Core Engine

## Resolved Document Set
- Requirements: `design/requirements.md`
- Specifications: `design/specifications.md`
- Implementation: `design/implementation.md`
- Requirement Checklist: `design/requirement-checklist.md`
- Phase ID: `PHASE-01`
- Phase Document: `design/phases/phase-01-core-engine.md`
- Phase Summary: `design/summaries/phase-01-core-engine-summary.md`
- Operational Guides:
  - `general`: `design/operational-guides/general.md`
  - `gameplay`: `design/operational-guides/gameplay.md`

**Phase ID**: `PHASE-01`
**Requirements**: `design/requirements.md`
**Specifications**: `design/specifications.md`
**Implementation**: `design/implementation.md`
**Requirement Checklist**: `design/requirement-checklist.md`
**Phase Summary**: `design/summaries/phase-01-core-engine-summary.md`

### Phase Scope
- Features included: Maze generation, canvas rendering, fog of war, player movement, exit marker, win detection, move counting
- Requirement IDs: `RQ-003`, `RQ-004`, `RQ-005`, `RQ-006`, `RQ-007`, `RQ-008`, `RQ-009`, `RQ-010`, `RQ-011`, `RQ-015`, `RQ-016`, `RQ-017`
- Deliverables: `index.html` (minimal shell), `style.css` (base styles), `game.js` (core engine functions)
- Dependencies: None — this is the first phase

### Cross-References
- Requirements sections: `design/requirements.md#functional-requirements`
- Specifications sections: `design/specifications.md#component-design`, `design/specifications.md#user-experience-architecture`
- Parent implementation sections: `design/implementation.md#implementation-phases`
- Related phases: `design/phases/phase-02-ui-and-scoring.md` (depends on this phase)

### Phase File Layout

| File | Responsibility | Key Functions | Entry Points |
| ---- | -------------- | ------------- | ------------ |
| `index.html` | Minimal page shell with canvas element and temporary hardcoded start trigger | N/A | Browser load |
| `style.css` | Black background, canvas centering, CSS custom properties for neon palette | N/A | Linked from HTML |
| `game.js` | Maze generation, grid model, rendering, input handling, fog of war, win detection | `generateMaze`, `render`, `handleKeydown`, `revealCells`, `checkWin`, `initGame` | `DOMContentLoaded` |

### Phase Data Changes

No persistent data in this phase. Game state is in-memory only. Maze grid is a 2D array of cell objects:

```javascript
// cell = { walls: { top, right, bottom, left }, revealed: false }
// gameState = { grid, width, height, playerRow, playerCol, exitRow, exitCol, moveCount, visibilityRadius, state }
```

For this phase, maze size and visibility radius are hardcoded constants (e.g., 20x20, radius 2) since the settings UI comes in Phase 2.

### Phase Testing Requirements

- Manual play-test: load `index.html`, verify maze renders, player moves, fog reveals, exit is visible, win triggers.
- Test each direction key (arrow + WASD).
- Verify wall collision does not count as a move.
- Verify fog reveals in Manhattan diamond pattern.
- Verify exit marker is visible through fog from game start.
- Test with different hardcoded sizes: 10x10, 40x40, 80x80.
- Verify no console errors.
