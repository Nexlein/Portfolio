# ADR 0002: Dependabot for dependency updates

- Status: Superseded by [ADR 0013](0013-renovate-instead-of-dependabot.md)
- Date: 2026-10-07
- Links: [#1](https://github.com/Nexlein/Portfolio/pull/1); sent to `dev` in `199817b` (2026-11-05); removed in [#131](https://github.com/Nexlein/Portfolio/pull/131)

## Context

[#1](https://github.com/Nexlein/Portfolio/pull/1) was the first step of the tooling overhaul: a CI quality gate, with dependencies kept current.

## Decision

Weekly Dependabot updates for npm (minor and patch grouped, majors apart) and GitHub Actions (grouped). From 2026-11-05 they targeted `dev`: "They went straight to main, past the integration branch." (`199817b`)

## Consequences

- Dependabot cannot read `mise.toml`, so Node and the hook tools were not updated. Renovate replaced it on 2026-11-25.
- The repository setting "Dependabot security updates" stays on ([ADR 0013](0013-renovate-instead-of-dependabot.md)).
