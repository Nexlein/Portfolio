# ADR 0012: No open-source licence

- Status: Accepted
- Date: 2026-11-05
- Links: `9bcda39`, `e63c386` (released in [#119](https://github.com/Nexlein/Portfolio/pull/119))

## Context

`package.json` carried `"license": "ISC"` with no licence file. `9bcda39`: "The package is private, and the ISC field goes: there is no licence file."

## Decision

All rights reserved. The code is public to read. No `LICENSE` file, no `license` field, `"private": true`.

## Consequences

- Others may read the code, not reuse it. GitHub shows no licence.
- No contributing guide, code of conduct or issue templates: it is a one-person repository.
