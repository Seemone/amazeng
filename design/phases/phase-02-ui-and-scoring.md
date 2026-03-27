# Phase: UI and Scoring

## Resolved Document Set
- Requirements: `design/requirements.md`
- Specifications: `design/specifications.md`
- Implementation: `design/implementation.md`
- Requirement Checklist: `design/requirement-checklist.md`
- Phase ID: `PHASE-02`
- Phase Document: `design/phases/phase-02-ui-and-scoring.md`
- Phase Summary: `design/summaries/phase-02-ui-and-scoring-summary.md`
- Operational Guides:
  - `general`: `design/operational-guides/general.md`
  - `gameplay`: `design/operational-guides/gameplay.md`

**Phase ID**: `PHASE-02`
**Requirements**: `design/requirements.md`
**Specifications**: `design/specifications.md`
**Implementation**: `design/implementation.md`
**Requirement Checklist**: `design/requirement-checklist.md`
**Phase Summary**: `design/summaries/phase-02-ui-and-scoring-summary.md`

### Phase Scope
- Features included: Start screen with settings form (size presets, custom size, visibility radius), win screen overlay, scoreboard (localStorage), input validation, state machine transitions
- Requirement IDs: `RQ-001`, `RQ-002`, `RQ-012`, `RQ-013`, `RQ-014`, `RQ-018`
- Deliverables: Updated `index.html` (start/win screen markup), updated `style.css` (screen styling), updated `game.js` (UI controller, score manager, validation)
- Dependencies: `PHASE-01` (core engine must be functional)

### Cross-References
- Requirements sections: `design/requirements.md#functional-requirements`
- Specifications sections: `design/specifications.md#component-design`, `design/specifications.md#cross-cutting-concerns`
- Parent implementation sections: `design/implementation.md#implementation-phases`
- Related phases: `design/phases/phase-01-core-engine.md` (dependency)

### Phase File Layout

| File | Responsibility | Key Functions | Entry Points |
| ---- | -------------- | ------------- | ------------ |
| `index.html` | Start screen form (size selector, radius slider, start button), win screen overlay (score, buttons), scoreboard view | N/A | Browser load |
| `style.css` | Start screen modal styling, win screen overlay, scoreboard table, button styles, form styles — all neon-on-black | N/A | Linked from HTML |
| `game.js` | `showStartScreen`, `showWinScreen`, `saveScore`, `loadScores`, `showScoreboard`, `validateSettings`, state transitions | `showStartScreen`, `showWinScreen`, `saveScore`, `loadScores`, `validateSettings` | Start button click, win event |

### Phase Data Changes

Introduces localStorage persistence:

- Key format: `maze_scores_<W>x<H>_r<R>` (e.g., `maze_scores_20x20_r2`)
- Value: JSON array of `{ moves: number, date: string }`, max 10 entries, sorted ascending by moves
- Read on: scoreboard view, win screen (personal best check)
- Write on: game win (insert if qualifies for top 10)
- Error handling: try/catch around all localStorage access — degrade gracefully

### Phase Testing Requirements

- Start screen: verify all size presets populate correct dimensions, custom size inputs work, radius slider/dropdown works.
- Validation: custom sizes 0, -1, 81, non-numeric values are rejected with inline error.
- Win screen: displays correct move count, shows "New best!" when applicable, Play Again starts new game with same settings, Back to Menu returns to start screen.
- Scoreboard: scores persist across page reloads, scores are isolated per configuration, only top 10 retained, sorted by moves ascending.
- State transitions: START_SCREEN → PLAYING → WIN_SCREEN → START_SCREEN all work correctly.
- Cross-browser: verify in Chrome, Firefox, Safari, Edge.
