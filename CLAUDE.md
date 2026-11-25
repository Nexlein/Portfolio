# Portfolio

Personal portfolio of Nielsen COMBE--BRACCIALE (alias Nexlein): https://nexlein.vercel.app. Vanilla TypeScript + Vite, no framework, Vercel. EN + FR. Versions: `mise.toml` (Node, tools), `package.json` (packages).

## Start here (save tokens)

- `.claude/codemap.md`: every `.ts`/`.css` file in `src/`, `vite-plugins/`, `scripts/`, `e2e/`, plus the templates, with purpose, exports, imports and "used by". Read it before searching; open only the files it points to. Configs and workflows: `docs/repo-map.md`.
- `TODO.md` (untracked, owner's notes): the current review list.
- `README.md` → docs index. Open the one page you need: `docs/architecture.md`, `docs/content.md`, `docs/checks.md`, `docs/operations.md`, `docs/troubleshooting.md`; decisions in `docs/adr/`.

## How the site works

- Every page is rendered at build time, once per language (`vite-plugins/pages.ts`: `PAGES`, plus `NOT_FOUND` for the 404). Templates (`index.html`, `cv.html`, `project.html`, `404.html`) mark slots with `data-render="<block>"` (filled by `src/pages/content/render.ts` from `src/pages/<page>/blocks.ts`) and `data-i18n="<key>"`. Visitors and crawlers get finished HTML; page scripts (`src/pages/<page>/<page>.ts`) only add motion and interaction.
- Everything `vite-plugins/*.ts` imports, transitively (blocks, render.ts, `src/data`, `src/core`, `src/i18n`, Charts data/render, NeuralMap graph, Nav/Footer render, parts of `src/ui`), runs in Node: relative `.ts` imports only, never `@/` (`node-safe.test.ts`).
- Facts live in `src/data/` (`profile.ts`, `projects.ts`), as `{ en, fr }`; interface words in `src/i18n/{en,fr}.ts`. Charts and the map compute everything from the data: real data only, nothing typed in by hand.
- Design: tokens and themes in `src/styles/tokens.css` (`html[data-theme]`; ids in `src/components/Nav/themes.ts`), shared pieces in `base.css`. Schibsted Grotesk + IBM Plex Mono. Amber `--signal` = activity, used sparingly.

## Commands

- `npm run dev` · `npm run build` · `npm run preview` (production headers)
- `npm run check`: the CI checks in one command (audit, format, lint, knip, typecheck, actionlint, tests); needs `mise install` and the network
- `npm run typecheck` · `npm test` (Vitest) · `npm run lint` (Oxlint + Stylelint) · `npm run format:check` · `npm run knip` (dead code)
- `npm run test:e2e` (builds, then Playwright desktop + mobile Chromium) · `npm run cv:pdf` (after a build; fails if the CV leaves one A4 page)
- `npm run codemap` (also run by pre-commit)
- Done means: `npm run check` passes; e2e for UI changes; check the page in the browser for visual changes.

## Rules

- Content changes: EN and FR together (`dictionaries.test.ts` checks keys). Content rules: `docs/content.md`.
- New project: `src/data/projects.ts` + media in `public/projects/<id>/` (`npm run media` needs ffmpeg). Everything else follows.
- Strict CSP (`vercel.json`, mirrored by `vite preview` except `upgrade-insecure-requests`, and COOP on the CI WebKit server): no inline `style=` / scripts / handlers in HTML. Set styles from JS via the CSSOM. The head script is allowed by hash: editing it means updating the hash (`headers.test.ts` prints it).
- Content must stay readable without JS (reveals only hide under `html.js`); respect `prefers-reduced-motion`.
- Oxlint bans `Array#sort` (use `toSorted`), shadowed names, and inner functions that capture nothing (move them to module scope).
- Don't edit generated output: `dist/`, `cv-pdf/`, `test-results/`, `.claude/codemap.md`.
- Prettier: 4 spaces, 120 cols, single quotes, no trailing commas. Format touched files only.
- Docs: a change to a command, path, flow or setting updates the matching doc in the same commit. Name the source file rather than copying versions or counts. `src/docs.test.ts` checks links, paths and scripts.
- Local browser tests: Chromium only. Firefox and WebKit run in CI.
- Never run `husky` with arguments (it rewrites `core.hooksPath` and breaks every commit).

## Git flow

- `main` = production (Vercel). `dev` = integration. Work on `feat/*`, `fix/*`, `chore/*` from `dev`, PR into `dev`; `dev` → `main` to release, merge commits only. Steps: `docs/operations.md`.
- `main` requires checks by job `name:`: renaming a CI job blocks PRs into `main`.
- Conventional commits (`feat(home): ...`). Pre-commit runs a secret scan, lint-staged, typecheck, tests, codemap; never `--no-verify`.
- Keep the `cv` GitHub release and its tag: `/cv.pdf` redirects to `releases/download/cv/...` (CI uploads the PDFs there from `main`). `v1-classic` = old site, tag `prototype-redesign` = design prototypes.
