# ADR 0005: Strict Content-Security-Policy, no inline code

- Status: Accepted
- Date: 2026-10-07
- Links: [#11](https://github.com/Nexlein/Portfolio/pull/11); WebKit test server without COOP in [#71](https://github.com/Nexlein/Portfolio/pull/71)

## Context

[#11](https://github.com/Nexlein/Portfolio/pull/11): "Before this, the live site only sent Vercel's default HSTS header."

## Decision

- `vercel.json` sets a CSP that allows the site's own origin only, with no `unsafe-inline` or `unsafe-eval`, plus `nosniff`, no framing, a strict referrer policy and a restrictive `Permissions-Policy`.
- The only inline code is the head script (`vite-plugins/shared-head.ts`), allowed by its sha256 hash.
- Inline `style` attributes became classes, "so the upcoming CSP can forbid them" (`c8b65a8`).

## Consequences

- No inline `style=`, `<script>` or event handlers in templates; styles are set from JS through the CSSOM. `src/pages/headers.test.ts` enforces it and recomputes the hash.
- Editing the head script means a new hash in `vercel.json`. A new third-party origin means a CSP change and test changes ([architecture.md](../architecture.md#add-a-third-party-origin)).
- `vite preview` serves the same headers, so browser tests and Lighthouse run under the real policy. Local exceptions: no `upgrade-insecure-requests`, and the WebKit test server drops COOP.
