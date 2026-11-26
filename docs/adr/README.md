# Architecture decision records

Why things are the way they are. One file per decision; a new decision supersedes an old one rather than editing it ([ADR 0000](0000-record-decisions.md)). New ADR: copy [template.md](template.md) to the next number and add it below.

| ADR                                               | Decision                                                             | Date       | Status             |
| ------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ------------------ |
| [0000](0000-record-decisions.md)                  | Record decisions as ADRs                                             | 2026-11-25 | Accepted           |
| [0001](0001-vanilla-typescript-and-vite.md)       | Vanilla TypeScript and Vite, no framework                            | 2026-06-14 | Accepted           |
| [0002](0002-dependabot.md)                        | Dependabot for dependency updates                                    | 2026-10-07 | Superseded by 0013 |
| [0003](0003-oxlint-instead-of-eslint.md)          | Oxlint instead of ESLint                                             | 2026-10-07 | Accepted           |
| [0004](0004-no-third-party-requests.md)           | No third-party requests: self-hosted fonts, analytics only on Vercel | 2026-10-07 | Accepted           |
| [0005](0005-strict-csp.md)                        | Strict Content-Security-Policy, no inline code                       | 2026-10-07 | Accepted           |
| [0006](0006-build-time-rendering-per-language.md) | Build-time rendering, one page per language                          | 2026-10-07 | Accepted           |
| [0007](0007-cv-pdf-release.md)                    | CV PDF built in CI, served from a rolling release                    | 2026-10-07 | Accepted           |
| [0008](0008-content-as-data.md)                   | Content as typed bilingual data                                      | 2026-10-07 | Accepted           |
| [0009](0009-dev-main-flow.md)                     | `dev` → `main` flow with required checks                             | 2026-10-08 | Accepted           |
| [0010](0010-test-policy.md)                       | No retries, hard Lighthouse gates, Firefox and WebKit in CI          | 2026-10-14 | Accepted           |
| [0011](0011-mise-for-tools.md)                    | mise for Node and the hook tools                                     | 2026-10-29 | Accepted           |
| [0012](0012-no-open-source-license.md)            | No open-source license                                               | 2026-11-05 | Accepted           |
| [0013](0013-renovate-instead-of-dependabot.md)    | Renovate instead of Dependabot                                       | 2026-11-25 | Accepted           |
| [0014](0014-npm-run-check.md)                     | `npm run check` as the one list of checks                            | 2026-11-25 | Accepted           |
