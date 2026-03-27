# CLAUDE.md — Maze Explorer Browser Game

## Project Overview

A standalone HTML/CSS/JS browser game (no frameworks, no build tools, no dependencies). Three files: `index.html`, `style.css`, `game.js`. Runs from `file://` or any static server.

## HTML Best Practices

- Use semantic HTML5 elements (`<main>`, `<section>`, `<header>`, `<nav>`, `<button>`, `<label>`, `<fieldset>`) — not generic `<div>` soup
- Use `<button>` for interactive controls, never `<div onclick>`
- Associate `<label>` elements with form inputs via `for`/`id`
- Include `lang` attribute on `<html>`, charset meta, and viewport meta
- Use `<canvas>` for the game rendering surface only — UI chrome stays in HTML
- Keep the DOM minimal; the game renders to canvas, not DOM nodes
- Validate: no unclosed tags, no deprecated attributes, proper nesting
- Use `type="number"` with `min`/`max` for numeric inputs
- Ensure tab order and keyboard accessibility for start/win screen controls

## CSS Best Practices

- Define the neon color palette via CSS custom properties on `:root` (see specifications.md)
- Use custom properties (`var(--color-*)`) everywhere — no hardcoded hex values in rules
- Use modern layout: flexbox or grid for screen centering and UI layout
- Style canvas responsively — size it via CSS to fill viewport, keep `width`/`height` attributes for resolution
- Avoid `!important`; use specificity naturally
- Use `box-sizing: border-box` globally
- Keep selectors flat and simple — no deep nesting, no IDs for styling (IDs are for JS hooks)
- Group related properties logically (layout, box model, typography, visual)
- Use `rem`/`em` for typography, `px` for borders/shadows where precision matters
- Prefer shorthand properties where clear (`margin`, `padding`, `font`)
- One declaration per line, consistent formatting
- No unused rules — if a style is removed from HTML, remove the CSS

## JavaScript Best Practices

- Vanilla ES2020+ — no libraries, no transpilation
- Use `const` by default, `let` when reassignment is needed, never `var`
- Use strict equality (`===`/`!==`) everywhere
- Use arrow functions for callbacks, regular functions for named module-level functions
- Wrap in an IIFE or use a single namespace object to avoid polluting global scope
- Event listeners: `addEventListener`, never inline `onclick` attributes
- `preventDefault()` on arrow keys during gameplay to prevent page scroll
- Use `requestAnimationFrame` only if continuous animation is needed; for discrete moves, direct canvas redraws are fine
- Canvas context: cache `ctx` reference, batch draw operations, clear before redraw
- Use explicit stack (not recursion) for maze generation to avoid call stack overflow on large grids
- Guard `localStorage` access with try/catch — game works without persistence
- No `eval()`, no `innerHTML` with user data, no string concatenation for DOM
- Use template literals for string construction
- Prefer `for...of` loops over index-based loops where appropriate
- Keep functions small and single-purpose — match the module breakdown in specifications.md
- Use descriptive names: `revealCellsAround(row, col, radius)` not `update(r, c, n)`
- Comment only non-obvious logic (algorithm steps, math, workarounds) — don't comment self-evident code

## General Rules

- No external dependencies — everything is self-contained in three files
- No build step, no bundler, no package.json
- Test by opening `index.html` in a browser
- Follow the specifications in `design/specifications.md` for architecture, data model, and algorithms
- Keep the codebase small and readable — this is a single-page game, not an enterprise app
