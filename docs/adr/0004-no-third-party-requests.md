# ADR 0004: No third-party requests: self-hosted fonts, analytics only on Vercel builds

- Status: Accepted
- Date: 2026-10-07
- Links: fonts [#10](https://github.com/Nexlein/Portfolio/pull/10); analytics [#13](https://github.com/Nexlein/Portfolio/pull/13)

## Context

[#10](https://github.com/Nexlein/Portfolio/pull/10): the Google Fonts stylesheet blocked rendering and sent visitor IPs to Google. Self-hosting took the home page's Lighthouse performance from 84 to 100 and third-party requests from 6 to 0.

## Decision

- Fonts come from Fontsource packages and ship with the build. Today: Schibsted Grotesk (one variable file) and IBM Plex Mono, imported in `src/styles/tokens.css`.
- [Vercel Web Analytics](https://vercel.com/docs/analytics): cookie-free, served from the site's own origin, and compiled in only for builds made on Vercel (`IS_VERCEL_BUILD`, from the `VERCEL` environment variable, in `vite.config.ts`).

## Consequences

- The CSP stays own-origin ([ADR 0005](0005-strict-csp.md)), and no consent banner is needed.
- Local and CI builds never load analytics.
- `e2e/pages.spec.ts` fails if any request leaves the origin.
