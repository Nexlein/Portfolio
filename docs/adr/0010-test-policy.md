# ADR 0010: No retries, hard Lighthouse gates, Firefox and WebKit in CI

- Status: Accepted
- Date: 2026-10-14
- Links: [#63](https://github.com/Nexlein/Portfolio/pull/63), [#65](https://github.com/Nexlein/Portfolio/pull/65)

## Context

- Playwright started with one retry in CI ([#12](https://github.com/Nexlein/Portfolio/pull/12)). Lighthouse performance started as a warning below 80, "since shared runners make it noisy" (`2876c06`).
- The audit in [#63](https://github.com/Nexlein/Portfolio/pull/63) found a Firefox-only bug, a hash link landing 890 px off.
- Not written in the repo; observed by the owner: running Firefox and WebKit locally overloaded the owner's machine.

## Decision

- `retries: 0` ([#65](https://github.com/Nexlein/Portfolio/pull/65)): "a test that needs a second try is a bug to fix, not noise to hide" (`playwright.config.ts`).
- Every Lighthouse assertion is an error, performance included ([#63](https://github.com/Nexlein/Portfolio/pull/63)). Pages and minimum scores: `config/lighthouserc.json`.
- Firefox and WebKit run in CI on every PR; locally, desktop and mobile Chromium only.

## Consequences

- A flaky test gets fixed, not retried: chart timers ([#69](https://github.com/Nexlein/Portfolio/pull/69)), a WebKit reload ([#111](https://github.com/Nexlein/Portfolio/pull/111)), a hero test pinned to one simulation ([#133](https://github.com/Nexlein/Portfolio/pull/133)).
- The WebKit server runs without COOP and plays no video ([#71](https://github.com/Nexlein/Portfolio/pull/71)).
- An engine-specific failure is read from the CI trace, not reproduced locally.
