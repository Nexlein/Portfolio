# ADR 0003: Oxlint instead of ESLint

- Status: Accepted
- Date: 2026-10-07
- Links: [#6](https://github.com/Nexlein/Portfolio/pull/6); type-aware rules in `9bcda39` (2026-11-05, released in [#119](https://github.com/Nexlein/Portfolio/pull/119)); warnings fail since [#131](https://github.com/Nexlein/Portfolio/pull/131)

## Context

The project is on TypeScript 7. [#6](https://github.com/Nexlein/Portfolio/pull/6): "typescript-eslint only supports TypeScript `<6.1` and this project is on TS 7." That range is still the one in [typescript-eslint's supported versions](https://typescript-eslint.io/users/dependency-versions/).

## Decision

- [Oxlint](https://oxc.rs) for TypeScript (`.oxlintrc.json`): correctness and suspicious rules are errors, perf rules are warnings.
- Type-aware rules since 2026-11-05: they "catch what lint and tsc cannot, such as a forgotten await" (`9bcda39`).
- `npm run lint` and lint-staged pass `--deny-warnings`, so a warning fails too.
- [Stylelint](https://stylelint.io) for CSS.

## Consequences

- Oxlint's rule set, not ESLint's. In this repo that means `toSorted` rather than `sort`, no shadowed names, and helper functions that capture nothing live at module scope.
- Revisit when typescript-eslint supports TypeScript 7.
