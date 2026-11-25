# ADR 0007: CV PDF built in CI, served from a rolling release

- Status: Accepted
- Date: 2026-10-07
- Links: [#16](https://github.com/Nexlein/Portfolio/pull/16); own publish job in `9349a4f` (2026-11-05, released in [#119](https://github.com/Nexlein/Portfolio/pull/119))

## Context

The CV needs a stable PDF link in both languages that matches the CV page. Why a release rather than a committed PDF was not written down.

## Decision

- `npm run cv:pdf` prints `/cv.html` and `/fr/cv.html` to A4 with Playwright and fails if the CV needs a second page.
- On pushes to `main`, the `Publish CV` job uploads the PDFs to the GitHub release `cv` (`--clobber`). `/cv.pdf` and `/fr/cv.pdf` redirect there (`vercel.json`, temporary redirects).
- Publishing is its own job: "Now only a job with no checkout, no npm and no third-party action can write to the release." (`9349a4f`)

## Consequences

- The `cv` tag never moves (tag ruleset) and the release stays "Latest"; only its files change.
- The live PDF changes only when `main` does.
- The CV must fit on one A4 page in both languages: the `CV PDF` check fails otherwise.
