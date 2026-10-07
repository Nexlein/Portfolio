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

| Script                 | Description                        |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the Vite dev server          |
| `npm run build`        | Typecheck and build to `dist/`     |
| `npm run preview`      | Serve the production build locally |
| `npm run typecheck`    | Run `tsc --noEmit`                 |
| `npm test`             | Run Vitest                         |
| `npm run format`       | Format all files with Prettier     |
| `npm run format:check` | Check formatting without writing   |

## Project structure

```
src/
├── components/   UI components (Navbar, modals, project views), one folder each
├── core/         App services: project rendering, scroll observer, i18n engine
├── data/         projects.ts, the single source of truth for project entries
├── i18n/         Translation dictionaries (en, fr)
├── pages/        Per-page entry scripts and styles
├── styles/       Global theme, base styles and utilities
└── utils/        Shared helpers (SVG icons)
public/
└── projects/     Project media (images, videos), one folder per project id
```

## Adding a project

1. Put the media in `public/projects/<id>/`.
2. Add a `ProjectEntry` to `src/data/projects.ts`.
3. Add its translation keys to both `src/i18n/en.ts` and `src/i18n/fr.ts`.

## Quality checks

- **Pre-commit** (Husky): Prettier on staged files, typecheck, tests.
- **CI** (GitHub Actions, on PRs and `main`): `npm audit`, format check, typecheck, tests, build.
- **Dependabot**: weekly npm and GitHub Actions updates.
- **Deploy**: Vercel builds previews for PRs and production from `main`.
