# ADR 0006: Build-time rendering, one page per language

- Status: Accepted
- Date: 2026-10-07
- Links: [#14](https://github.com/Nexlein/Portfolio/pull/14); `data-render` blocks in [#19](https://github.com/Nexlein/Portfolio/pull/19); head tags in `renderPage` in `24b82dc` (2026-11-05, released in [#119](https://github.com/Nexlein/Portfolio/pull/119))

## Context

[#14](https://github.com/Nexlein/Portfolio/pull/14): "Crawlers and link previews don't run JavaScript, so Google and LinkedIn only ever saw the English text."

## Decision

- The `sitePages` plugin (`vite-plugins/pages.ts`) renders every page once per language: English at the root, French under `/fr/`, each with its own `lang`, title, description, Open Graph tags, canonical URL and `hreflang` alternates.
- Templates mark slots with `data-render` and `data-i18n`; the build fills them ([#19](https://github.com/Nexlein/Portfolio/pull/19)).
- Since 2026-11-05 `renderPage` writes every head tag: "A new page now only needs its entry in PAGES." (`24b82dc`)

## Consequences

- Visitors and crawlers get finished HTML; page scripts only add motion and interaction. The URL decides the language.
- Modules the build runs from Node use relative `.ts` imports (`src/pages/node-safe.test.ts`). An unknown dictionary key stops the build.
- Anything computed from today's date is frozen at build time: `.github/workflows/rebuild.yml` rebuilds production weekly.
