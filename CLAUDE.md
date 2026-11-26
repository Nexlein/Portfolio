# Portfolio

Personal portfolio of Nielsen COMBE--BRACCIALE (alias Nexlein): https://nexlein.vercel.app. Vanilla TypeScript + Vite, no framework, Vercel. EN + FR. Versions: `mise.toml` (Node, tools), `package.json` (packages).

## Start here (save tokens)

- `.claude/codemap.md`: every `.ts`/`.css` file in `src/`, `vite-plugins/`, `scripts/`, `e2e/`, plus the templates, with purpose, exports, imports and "used by". Read it before searching. Configs and workflows: `docs/repo-map.md`.
- `TODO.md` (untracked, owner's notes): the current review list.
- `README.md`: commands and the docs index. Open only the page you need in `docs/`; decisions in `docs/adr/`.

## How the site works

- Every page is rendered at build time, once per language (`vite-plugins/pages.ts`: `PAGES`, plus `NOT_FOUND` for the 404). Templates (`index.html`, `cv.html`, `project.html`, `404.html`) mark slots with `data-render="<block>"` (filled by `src/pages/content/render.ts` from `src/pages/<page>/blocks.ts`) and `data-i18n="<key>"`. Page scripts (`src/pages/<page>/<page>.ts`) only add motion and interaction.
- Everything `vite-plugins/*.ts` imports, transitively, runs in Node: relative `.ts` imports only, never `@/` (`node-safe.test.ts`).
- Facts live in `src/data/` as `{ en, fr }`; interface words in `src/i18n/{en,fr}.ts`. Real data only: charts and the map compute everything from the data.
- Design: tokens and themes in `src/styles/tokens.css` (ids in `src/components/Nav/themes.ts`), shared pieces in `base.css`. Amber `--signal` = activity, used sparingly.

## Done means

`npm run check` passes (needs `mise install` and the network); browser tests (`npm run test:e2e`, Chromium only locally) for UI changes; the page checked in the browser for visual changes.

## Rules

- Content: EN and FR together. Rules and recipes: `docs/content.md`. A new project can trip `graph.test.ts` (map layout): see "Add a project" there.
- Strict CSP (`vercel.json`): no inline `style=` / scripts / handlers in HTML; set styles from JS via the CSSOM. Editing the head script means a new hash (`headers.test.ts` prints it). Preview differences: `docs/architecture.md`.
- Content must stay readable without JS (reveals only hide under `html.js`); respect `prefers-reduced-motion`.
- Oxlint bans `Array#sort` (use `toSorted`), shadowed names, and inner functions that capture nothing.
- Don't edit generated output: `dist/`, `cv-pdf/`, `test-results/`, `.claude/codemap.md`.
- Prettier: 4 spaces, 120 cols, single quotes, no trailing commas. Format touched files only.
- Docs: a change to a command, path, flow or setting updates its doc in the same commit. Name the source file instead of copying versions or counts. `src/docs.test.ts` checks links, paths, file names and scripts.
- Never run `husky` with arguments (it rewrites `core.hooksPath` and breaks every commit).

## Git flow

- `main` = production (Vercel), `dev` = integration. Branch `feat/*`, `fix/*`, `chore/*` from `dev`, PR into `dev`; release `dev` → `main`, merge commits only (`docs/operations.md`).
- `main` requires checks by job `name:`: renaming a CI job blocks PRs into `main` ([docs/checks.md](docs/checks.md#ci)).
- Conventional commits (`feat(home): ...`). Pre-commit runs a secret scan, lint-staged, typecheck, tests, codemap; never `--no-verify`.
- Never delete or move the protected tags, `cv` included (`/cv.pdf` redirects to its release): list in [docs/operations.md](docs/operations.md#branches-and-release).
