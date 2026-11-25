# ADR 0001: Vanilla TypeScript and Vite, no framework

- Status: Accepted
- Date: 2026-06-14 (first commit)
- Links: first code commit `734b13f` (the very first, `75b1ab8`, holds media only); redesign [#20](https://github.com/Nexlein/Portfolio/pull/20)

## Context

No reason was written at the time. What the code shows: a few pages, content known at build time, motion drawn on canvas and SVG. The first commit with code already used Vite and TypeScript, and no UI framework ever entered `package.json`. The redesign ([#20](https://github.com/Nexlein/Portfolio/pull/20), 2026-10-08) kept the stack.

## Decision

Vanilla TypeScript. Vite as dev server and bundler. No UI framework, no client-side rendering library.

## Consequences

- No framework runtime ships to visitors. Pages are static HTML filled at build time ([ADR 0006](0006-build-time-rendering-per-language.md)).
- DOM code is written by hand, one folder per feature in `src/components/`.
- Upgrades touch Vite and TypeScript only.
