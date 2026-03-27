# Phase Summary: UI and Scoring

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

### Summary Scope
- Phase ID: `PHASE-02`
- Requirement IDs completed: `RQ-001`, `RQ-002`, `RQ-012`, `RQ-013`, `RQ-014`, `RQ-018`
- Operational guide topics touched: `gameplay`

### What Changed

- **index.html**: Complete restructure with four screen sections:
  - `#start-screen`: Game title, size preset buttons (Small 10x10, Medium 20x20, Large 40x40, Custom), custom width/height inputs with `type="number"` min/max, visibility radius range slider with `<output>`, Start Game and View Scoreboard buttons
  - `#game-screen`: Contains HUD and canvas (previously the only content)
  - `#win-screen`: Fixed overlay with move count, "New Personal Best!" indicator, Play Again and Back to Menu buttons
  - `#scoreboard-screen`: Config selector (size dropdown, radius dropdown), score table with rank/moves/date columns, "no scores" message, Back to Menu button

- **style.css**: Added ~180 lines of new styles:
  - `.screen` and `.screen[hidden]` / `.win-overlay[hidden]` for proper `display:none` when `hidden` attribute is set (CSS `display: flex` overrides `hidden` by default)
  - `.game-title` with cyan neon glow text-shadow
  - `.settings-group` fieldset styling with subtle borders
  - `.preset-btn` with `.selected` state (cyan fill)
  - `.custom-size-inputs` form layout
  - `.radius-selector` with range input accent-color
  - `.primary-btn` (green, for Start Game) and `.secondary-btn` (cyan outline, for other actions)
  - `.best-indicator` with gold glow
  - `.scoreboard-table` with styled headers and first-row gold highlight
  - `.error-message` in red for validation feedback

- **game.js**: Major refactoring from Phase 1:
  - Removed hardcoded `MAZE_WIDTH`, `MAZE_HEIGHT`, `VISIBILITY_RADIUS` constants
  - Added `currentSettings` object to preserve width/height/radius across Play Again
  - Added `initGame(width, height, radius)` parameterized entry point
  - Added `validateSettings(width, height)` — enforces 2–80 integer range with error messages
  - Added `getSelectedSize()` — reads from preset button `data-*` attrs or custom inputs
  - Added `handleStartClick()` — validates then starts game
  - Added `setupPresetButtons()` — wires exclusive selection and custom input toggle
  - Added `setupRadiusSlider()` — syncs range input to `<output>` display
  - Added `scoreKey(w, h, r)` — generates `maze_scores_WxH_rR` localStorage key
  - Added `loadScores(w, h, r)` — reads and parses localStorage with try/catch
  - Added `saveScore(moveCount)` — inserts score, sorts ascending, trims to 10, returns `isBest`
  - Added `refreshScoreboard()` — populates table from selected config
  - Added screen transition functions: `hideAllScreens()`, `showStartScreen()`, `showGameScreen()`, `showWinScreen()`, `showScoreboardScreen()`
  - Updated `showWinScreen()` to use persistent DOM elements instead of creating/removing
  - Updated `setup()` to wire all new button and select event listeners
  - Game now starts on `showStartScreen()` instead of immediately playing

### Key Design Decisions
- Used `hidden` HTML attribute with explicit `[hidden] { display: none }` CSS overrides rather than toggling classes — simpler, more semantic
- Preset buttons use `data-width` / `data-height` attributes — no JS preset map needed
- Scoreboard dropdown only shows preset sizes (10x10, 20x20, 40x40) — custom sizes can have scores saved but lack a dropdown entry; acceptable tradeoff for simplicity
- Win screen is a persistent DOM element shown/hidden, not dynamically created/removed (cleaner state management)
- `saveScore()` returns boolean `isBest` to drive the "New Personal Best!" indicator
- Custom size inputs shown/hidden via `hidden` attribute toggled by Custom preset button

### Public Interfaces and Contracts
- `initGame(width, height, radius)` — starts a new game with given settings
- `validateSettings(width, height)` — returns array of error strings (empty = valid)
- `saveScore(moveCount)` — persists score, returns `isBest` boolean
- `loadScores(w, h, r)` — returns sorted score array from localStorage
- localStorage key format: `maze_scores_<W>x<H>_r<R>`
- localStorage value: JSON array of `{ moves: number, date: string }`, max 10, ascending by moves

### Data Model/Storage Changes
- localStorage introduced (was deferred from Phase 1)
- Key format: `maze_scores_<W>x<H>_r<R>` (e.g., `maze_scores_20x20_r2`)
- Value: JSON array of `{ moves: number, date: "YYYY-MM-DD" }`, max 10 entries, sorted ascending by moves
- All localStorage access wrapped in try/catch — game functions without persistence

### Requirement Checklist Updates

| Requirement ID | Implementation Status | Test Status | Validating Tests | Notes |
| -------------- | --------------------- | ----------- | ---------------- | ----- |
| RQ-001 | Complete | Pending Manual | Manual: preset and custom size selection | Preset buttons + custom inputs |
| RQ-002 | Complete | Pending Manual | Manual: radius slider 1–5 | Range input with output display |
| RQ-012 | Complete | Pending Manual | Manual: win screen elements | Move count, personal best, Play Again, Back to Menu |
| RQ-013 | Complete | Pending Manual | Manual: localStorage scores persist | Key per config, top 10, sorted, try/catch |
| RQ-014 | Complete | Pending Manual | Manual: scoreboard from start screen | Separate screen with config selectors |
| RQ-018 | Complete | Pending Manual | Manual: size cap validation | `validateSettings()` enforces 2–80 range |

### Risks, Deviations, and Follow-up
- Scoreboard dropdown only lists preset sizes (10x10, 20x20, 40x40) — custom size scores exist in localStorage but aren't browseable from the dropdown. Could add dynamic entries in a future enhancement.
- CSS `display` values override the `hidden` attribute — required explicit `[hidden] { display: none }` rules on `.screen` and `.win-overlay` selectors.
- Cross-browser testing still required (form elements, range input styling, localStorage behavior).
