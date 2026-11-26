# ADR 0013: Renovate instead of Dependabot

- Status: Accepted. Supersedes [ADR 0002](0002-dependabot.md).
- Date: 2026-11-25
- Links: [#131](https://github.com/Nexlein/Portfolio/pull/131); config fix and validator [#134](https://github.com/Nexlein/Portfolio/pull/134); validator job on every PR, so `main` can require it [#136](https://github.com/Nexlein/Portfolio/pull/136)

## Context

`6f06c94` ([#131](https://github.com/Nexlein/Portfolio/pull/131)): "Renovate also covers mise.toml (Node, gitleaks), which Dependabot cannot read."

## Decision

The hosted Renovate app (Mend), configured in `renovate.json`:

- PRs into `dev`, on a weekly schedule.
- One PR for npm minor and patch updates, one for GitHub Actions, one weekly lockfile refresh; majors apart ([`separateMajorMinor`](https://docs.renovatebot.com/configuration-options/#separatemajorminor)). `package.json` ranges move with the version.
- A Node major moves `mise.toml`, `engines` and `@types/node` together.
- npm releases wait 3 days ([`security:minimumReleaseAgeNpm`](https://docs.renovatebot.com/presets-security/)).
- `mise.toml` majors (`gitleaks = "8"`) read as ranges.

## Consequences

- Renovate reads its config from `main` only ([Renovate docs](https://docs.renovatebot.com/configuration-options/)) and stops on one invalid rule. Hence the `Renovate config` job ([#134](https://github.com/Nexlein/Portfolio/pull/134), [#136](https://github.com/Nexlein/Portfolio/pull/136)); how it runs: [operations.md](../operations.md#dependency-updates).
- Dependabot security updates stay on: they fix transitive advisories that Renovate leaves ([operations.md](../operations.md#dependency-updates)).
