# ADR 0001: Vanilla TypeScript and Vite, no framework

- Status: Accepted
- Date: 2026-06-14 (first commit)
- Links: first commit with the Vite and TypeScript setup, `734b13f` (same day as the first commit); redesign [#20](https://github.com/Nexlein/Portfolio/pull/20)

## Context

No reason was written at the time. What the code shows: a few pages, content known at build time, motion drawn on canvas and SVG. The Vite and TypeScript setup came on the first day (`734b13f`), and no UI framework ever entered `package.json`. The redesign ([#20](https://github.com/Nexlein/Portfolio/pull/20), 2026-10-08) kept the stack.

## Decision

Vanilla TypeScript. Vite as dev server and bundler. No UI framework, no client-side rendering library.

## Consequences

- No framework runtime ships to visitors. Pages are static HTML filled at build time ([ADR 0006](0006-build-time-rendering-per-language.md)).
- DOM code is written by hand, one folder per feature in `src/components/`.
- Upgrades touch Vite and TypeScript only.
