# Portfolio

[![CI](https://github.com/Nexlein/Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/Nexlein/Portfolio/actions/workflows/ci.yml)

Personal software engineering portfolio of Nielsen Combe-Bracciale. Built with vanilla TypeScript and Vite, deployed on Vercel. Content is available in English and French.

## Pages

| Page         | HTML                | Entry script                             |
| ------------ | ------------------- | ---------------------------------------- |
| Home         | `index.html`        | `src/pages/home/home.ts`                 |
| CV           | `cv.html`           | `src/pages/cv/cv.ts`                     |
| Availability | `availability.html` | `src/pages/availability/availability.ts` |

## Getting started

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
npm run dev
```

## Scripts

| Script                  | Description                             |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Start the Vite dev server               |
| `npm run build`         | Typecheck and build to `dist/`          |
| `npm run preview`       | Serve the production build locally      |
| `npm run typecheck`     | Run `tsc --noEmit`                      |
| `npm test`              | Run Vitest                              |
| `npm run lint`          | Lint TS (Oxlint) and CSS (Stylelint)    |
| `npm run lint:fix`      | Lint and autofix                        |
| `npm run media:posters` | Generate missing video posters (ffmpeg) |
| `npm run media:video`   | Re-encode a video for the web (ffmpeg)  |
| `npm run audit`         | Dependency audit (`audit-ci.jsonc`)     |
| `npm run format`        | Format all files with Prettier          |
| `npm run format:check`  | Check formatting without writing        |

## Project structure

```
src/
├── components/       One folder per UI feature; internals stay inside it
│   ├── CvModal/      CV iframe modal
│   ├── Navbar/       Injected nav bar + scroll behaviours (shadow, scroll spy)
│   ├── ProjectGrid/  Filters, "show more", cards; pure filter logic in filter.ts
│   └── ProjectModal/ Project detail modal, media markup, gallery
├── core/             App-wide services (i18n)
├── data/             projects.ts, the single source of truth for project entries
├── i18n/             Translation dictionaries (en, fr)
├── pages/            Per-page entry scripts and styles (home, cv, availability)
├── styles/           Global theme, base styles and utilities
└── ui/               Shared UI primitives (SVG icons)
public/
└── projects/         Project media (images, videos), one folder per project id
```

Conventions:

- Import across folders with the `@/` alias (`@/core/i18n`), within a folder with `./`.
- HTML pages stay at the repo root so their URLs (`/cv.html`, `/availability.html`) don't change.
- Tags every page needs in `<head>` (favicon, language guard) are injected by the `sharedHead` plugin in `vite-plugins/shared-head.ts`.

## Adding a project

1. Put the media in `public/projects/<id>/`.
2. Add a `ProjectEntry` to `src/data/projects.ts`.
3. Add its translation keys to both `src/i18n/en.ts` and `src/i18n/fr.ts`.

## SEO and social previews

Each page declares its own description, canonical URL and Open Graph / X tags in its `<head>`. All pages share `public/og-image.png` (1200×630, a screenshot of the home hero). `public/robots.txt` and `public/sitemap.xml` point crawlers at `https://nexlein.vercel.app`.

When adding a page, give it these tags and a sitemap entry; `src/pages/seo.test.ts` fails until you do.

## Tests

Vitest, colocated as `*.test.ts` next to the code they cover. DOM tests opt into happy-dom with a `// @vitest-environment happy-dom` header.

- `src/i18n/dictionaries.test.ts`: en/fr key parity, no empty strings, every `data-i18n` key used in HTML/TS exists, every project has a description.
- `src/data/projects.test.ts`: unique ids, media files exist in `public/`, alt text present, GitHub URLs valid, each category has a filter button.
- `src/core/i18n.test.ts`: lookup, fallback, language persistence, DOM re-translation.
- `src/components/ProjectModal/media.test.ts`: video/image/gallery markup.
- `src/components/ProjectGrid/filter.test.ts`: year/category filtering, category fallback, pagination.
- `src/pages/seo.test.ts`: every page has a description, canonical URL, social preview tags, and a sitemap entry.

## Media

Project media lives in `public/projects/<id>/` and must be web-ready (a test enforces the formats):

- **Images**: WebP, at most 1200px on the long side (`ffmpeg -i in.png -vf "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease" -quality 80 out.webp`).
- **Videos**: H.264 MP4 without audio, at most 960px wide, `faststart`. Run `npm run media:video -- public/projects/<id>/<name>.mp4` to re-encode in place.
- **Posters**: every video needs `<name>.poster.webp`. Run `npm run media:posters` to generate missing ones.

Card videos load nothing until they scroll into view (`preload="none"` + an IntersectionObserver in `src/ui/video.ts`) and pause off screen. With `prefers-reduced-motion`, cards keep their poster and the modal shows controls instead of autoplaying.

Fonts are self-hosted with Fontsource (latin subset), so pages make no third-party requests.

## Security headers

`vercel.json` sets the production headers: a strict Content-Security-Policy (our own origin only, no `unsafe-inline`), `nosniff`, `SAMEORIGIN` framing (the home page frames the CV), a strict referrer policy and a restrictive `Permissions-Policy`. Hashed files in `/assets/` are cached for a year; project media for a day.

`npm run preview` serves the build with the same headers, so CSP problems show up locally.

Because of the CSP:

- No inline `style="…"` attributes, inline event handlers or inline `<script>` in the HTML pages (`src/pages/headers.test.ts` enforces it). Use classes and modules.
- The only inline code is the language guard in `vite-plugins/shared-head.ts`, allowed by its sha256 hash. Editing it changes the hash: update `vercel.json` (the test prints the expected value).
- New third-party origins (analytics, embeds, CDNs) must be added to the matching CSP directive.

## Quality checks

- **Pre-commit** (Husky + lint-staged): Oxlint/Stylelint autofix and Prettier on staged files, then typecheck and tests.
- **CI** (GitHub Actions, on PRs and `main`): dependency audit, format check, lint, typecheck, tests, build.
- **Linting**: [Oxlint](https://oxc.rs) for TypeScript (`.oxlintrc.json`; chosen over ESLint because typescript-eslint does not support TypeScript 7), [Stylelint](https://stylelint.io) for CSS (`.stylelintrc.json`).
- **Audit**: fails on high/critical advisories. Accepted exceptions live in `audit-ci.jsonc`, each with a reason.
- **Lighthouse** (CI job after the build): audits every page in `dist/`. Accessibility, best practices and SEO must score at least 95; performance below 80 warns. Thresholds live in `lighthouserc.json`; reports are uploaded as a workflow artifact.
- **Dependabot**: weekly npm and GitHub Actions updates.
- **Deploy**: Vercel builds previews for PRs and production from `main`.
