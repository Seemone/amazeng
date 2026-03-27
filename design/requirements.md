# Requirements: Maze Explorer

## User Experience Requirements

- **Usability goals**: Player can start a game within 5 seconds of loading the page. Controls are immediately intuitive (arrow keys / WASD). No tutorial needed beyond on-screen hints.
- **Accessibility requirements**: Full keyboard navigation (no mouse required). High-contrast neon-on-black palette. Screen-readable game state (move count, win/loss).
- **Device and platform support**: Modern desktop browsers (Chrome, Firefox, Safari, Edge). Desktop-first — no mobile touch controls required.
- **Performance perception**: Maze generation completes in under 1 second for all supported sizes. Canvas redraws on each move feel instantaneous (<16ms).
- **Error handling**: Invalid custom size inputs are rejected with inline feedback. localStorage failures degrade gracefully (game still works, scores just aren't saved).

## Functional Requirements

- **RQ-001** Player can select maze size from presets (Small 10x10, Medium 20x20, Large 40x40) or enter custom dimensions
  - **Tags**: `guide:gameplay`, `ui`, `configuration`

- **RQ-002** Player can select visibility radius (1–5, default 2) at game start
  - **Tags**: `guide:gameplay`, `ui`, `configuration`

- **RQ-003** Game generates a unique procedural maze each playthrough using recursive backtracker algorithm
  - **Tags**: `maze-generation`, `core`

- **RQ-004** Player start position is randomly placed in the maze
  - **Tags**: `maze-generation`, `core`

- **RQ-005** Exit position is randomly placed in the maze (different from start) and always visible through fog
  - **Tags**: `guide:gameplay`, `maze-generation`, `rendering`

- **RQ-006** Maze is fully hidden at game start (fog of war) except for the exit marker
  - **Tags**: `guide:gameplay`, `rendering`, `fog-of-war`

- **RQ-007** Player movement reveals cells within the configured visibility radius (Manhattan distance) permanently
  - **Tags**: `guide:gameplay`, `fog-of-war`, `rendering`

- **RQ-008** Player moves using arrow keys and WASD (one cell per keypress)
  - **Tags**: `guide:gameplay`, `input`, `core`

- **RQ-009** Moving into a wall does nothing and does not increment the move counter
  - **Tags**: `guide:gameplay`, `input`, `scoring`

- **RQ-010** Successful moves increment a visible move counter
  - **Tags**: `guide:gameplay`, `scoring`, `ui`

- **RQ-011** Reaching the exit cell triggers the win state
  - **Tags**: `guide:gameplay`, `core`, `scoring`

- **RQ-012** Win screen displays move count, personal best indication, play again, and back to menu options
  - **Tags**: `guide:gameplay`, `ui`, `scoring`

- **RQ-013** Scoreboard stores top 10 scores per configuration (size + visibility radius) in localStorage
  - **Tags**: `guide:gameplay`, `scoring`, `persistence`

- **RQ-014** Scoreboard is viewable from start screen for any configuration
  - **Tags**: `guide:gameplay`, `ui`, `scoring`

- **RQ-015** Visual style uses vibrant neon colors on black background with modern aesthetic
  - **Tags**: `rendering`, `ui`

- **RQ-016** Canvas rendering with glow effects (shadowBlur) for neon wall and exit appearance
  - **Tags**: `rendering`, `ui`

- **RQ-017** Cell size scales dynamically based on maze dimensions to fill the viewport
  - **Tags**: `rendering`, `ui`

- **RQ-018** Custom maze dimensions are capped at 80x80
  - **Tags**: `guide:gameplay`, `configuration`, `validation`

## Non-Functional Requirements

- **Performance**: Maze generation < 1 second for 80x80. Canvas redraw < 16ms per move.
- **Compatibility**: Works in Chrome, Firefox, Safari, Edge (latest two major versions).
- **Dependencies**: Zero external dependencies. No build step. Raw HTML/CSS/JS.
- **Deployment**: Self-contained — open `index.html` in a browser to play. No server required.
- **Maintainability**: Single JS file with clear function separation. CSS custom properties for theming.
