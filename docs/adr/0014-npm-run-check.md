# ADR 0014: `npm run check` as the one list of checks

- Status: Accepted
- Date: 2026-11-25
- Links: [#136](https://github.com/Nexlein/Portfolio/pull/136)

## Context

`5e3250a`: "Audit, format, lint, dead code, typecheck, workflows and unit tests ran as seven CI steps with no local equivalent."

## Decision

One npm script, `check`, in `package.json`. The CI job "Format, typecheck, test, build" runs it, then builds. A change is done when it passes.

## Consequences

- The list lives in one place: adding a check means adding it to the script.
- It stops at the first failure and needs the network (`npm audit`).
- Browser tests, Lighthouse and the CV PDF stay separate CI jobs: they need the build and browsers.
