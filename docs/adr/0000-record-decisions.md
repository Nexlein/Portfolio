# ADR 0000: Record decisions as ADRs

- Status: Accepted
- Date: 2026-11-25
- Links: [#138](https://github.com/Nexlein/Portfolio/pull/138)

## Context

The reasons behind the stack, the checks and the release flow sat in commit messages, PR bodies and asides in the README. Finding why something is the way it is meant reading the history.

## Decision

- One short file per decision in `docs/adr/`, numbered, written from [template.md](template.md).
- An accepted ADR is not rewritten. A new decision gets a new ADR, and the old one's status becomes "Superseded by".
- ADRs 0001 to 0014 were written on 2026-11-25, after the fact, from the commits and PRs they link. Where nothing was written at the time, the ADR says so.

## Consequences

- [README.md](README.md) lists every ADR; `src/docs.test.ts` fails if one is missing from it.
- A change that reverses a decision comes with its ADR in the same PR.
