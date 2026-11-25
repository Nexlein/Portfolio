# ADR 0011: mise for Node and the hook tools

- Status: Accepted
- Date: 2026-10-29
- Links: [#96](https://github.com/Nexlein/Portfolio/pull/96); gitleaks in `ee57c6c` (2026-11-05); actionlint and shellcheck in `1ee6f44` (2026-11-25)

## Context

Node was pinned in `.nvmrc`, and the secret-scan hook read gitleaks from `PATH`, at whatever version the machine had.

## Decision

- `mise.toml` pins Node ([#96](https://github.com/Nexlein/Portfolio/pull/96)), then gitleaks, actionlint and shellcheck: "so local and CI use the same versions and Renovate keeps them current" (`1ee6f44`).
- CI installs Node with `jdx/mise-action` (`.github/actions/setup`), and the other tools in the job that needs them.

## Consequences

- A new machine starts with `mise install`. On Windows, `%LOCALAPPDATA%\mise\shims` goes on the user `Path`, or the hooks do not find the tools ([troubleshooting.md](../troubleshooting.md)).
- Versions are majors (`gitleaks = "8"`); Renovate reads them as ranges ([ADR 0013](0013-renovate-instead-of-dependabot.md)).
- `engines.node` in `package.json` follows the same major, and Vercel reads it.
