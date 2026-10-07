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

| Script                 | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the Vite dev server            |
| `npm run build`        | Typecheck and build to `dist/`       |
| `npm run preview`      | Serve the production build locally   |
| `npm run typecheck`    | Run `tsc --noEmit`                   |
| `npm test`             | Run Vitest                           |
| `npm run lint`         | Lint TS (Oxlint) and CSS (Stylelint) |
| `npm run lint:fix`     | Lint and autofix                     |
| `npm run audit`        | Dependency audit (`audit-ci.jsonc`)  |
| `npm run format`       | Format all files with Prettier       |
| `npm run format:check` | Check formatting without writing     |

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
- Tags every page needs in `<head>` (favicon, language guard) are injected by the `sharedHead` plugin in `vite.config.ts`.

## Adding a project

1. Put the media in `public/projects/<id>/`.
2. Add a `ProjectEntry` to `src/data/projects.ts`.
3. Add its translation keys to both `src/i18n/en.ts` and `src/i18n/fr.ts`.

## Tests

Vitest, colocated as `*.test.ts` next to the code they cover. DOM tests opt into happy-dom with a `// @vitest-environment happy-dom` header.

- `src/i18n/dictionaries.test.ts`: en/fr key parity, no empty strings, every `data-i18n` key used in HTML/TS exists, every project has a description.
- `src/data/projects.test.ts`: unique ids, media files exist in `public/`, alt text present, GitHub URLs valid, each category has a filter button.
- `src/core/i18n.test.ts`: lookup, fallback, language persistence, DOM re-translation.
- `src/components/ProjectModal/media.test.ts`: video/image/gallery markup.
- `src/components/ProjectGrid/filter.test.ts`: year/category filtering, category fallback, pagination.

## Quality checks

- **Pre-commit** (Husky + lint-staged): Oxlint/Stylelint autofix and Prettier on staged files, then typecheck and tests.
- **CI** (GitHub Actions, on PRs and `main`): dependency audit, format check, lint, typecheck, tests, build.
- **Linting**: [Oxlint](https://oxc.rs) for TypeScript (`.oxlintrc.json`; chosen over ESLint because typescript-eslint does not support TypeScript 7), [Stylelint](https://stylelint.io) for CSS (`.stylelintrc.json`).
- **Audit**: fails on high/critical advisories. Accepted exceptions live in `audit-ci.jsonc`, each with a reason.
- **Dependabot**: weekly npm and GitHub Actions updates.
- **Deploy**: Vercel builds previews for PRs and production from `main`.
