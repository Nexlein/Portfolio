# ADR 0009: `dev` → `main` flow with required checks

- Status: Accepted
- Date: 2026-10-08 (first PR into `dev`)
- Links: [#20](https://github.com/Nexlein/Portfolio/pull/20); first release [#59](https://github.com/Nexlein/Portfolio/pull/59); CI on `main` pushes only [#106](https://github.com/Nexlein/Portfolio/pull/106); merge commits only [#136](https://github.com/Nexlein/Portfolio/pull/136)

## Context

`main` deploys production on Vercel. The redesign had to be built and checked without touching the live site.

## Decision

- `main` is production, `dev` integration. Work branches (`feat/*`, `fix/*`, `chore/*`) start from `dev` and come back by PR. A release is a PR from `dev` into `main`.
- `main` requires the CI jobs, the Renovate config check and the Vercel deployment to pass, for admins too. No force push, no deletion.
- Merge commits only, "so `dev` → `main` can never be squashed by mistake" ([#136](https://github.com/Nexlein/Portfolio/pull/136)).
- CI runs on PRs and on pushes to `main`: "every push to `dev` ran CI twice" ([#106](https://github.com/Nexlein/Portfolio/pull/106)).

## Consequences

- `dev` is not protected; its PRs carry the checks.
- `main` holds release merge commits that `dev` does not. A hotfix on `main` is merged back into `dev`.
- Required checks match job names: renaming a job blocks PRs into `main` ([checks.md](../checks.md#ci)).
