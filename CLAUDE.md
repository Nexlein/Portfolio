# Portfolio

Personal portfolio of Nielsen COMBE--BRACCIALE (alias Nexlein): https://nexlein.vercel.app. Vanilla TypeScript + Vite 8, no framework, Vercel. EN + FR. Node 22 (`.nvmrc`).

## Start here (save tokens)

- `.claude/codemap.md`: every source file with purpose, exports, imports and "used by". Read it before searching; open only the files it points to.
- `TODO.md` (untracked, owner's notes): the current review list.
- `README.md`: full docs (pages, content, tests, media, headers). Read the section you need, not the whole file.

## How the site works

- Every page is rendered at build time, once per language (`vite-plugins/pages.ts`, `PAGES`). Templates (`index.html`, `cv.html`, `project.html`) mark slots with `data-render="<block>"` (filled by `src/pages/content/render.ts` from `src/pages/<page>/blocks.ts`) and `data-i18n="<key>"`. Visitors and crawlers get finished HTML; page scripts (`src/pages/<page>/<page>.ts`) only add motion and interaction.
- Modules the build runs from Node (blocks, render.ts, data, Charts data/render, NeuralMap graph, Nav/Footer render) use relative `.ts` imports, never `@/`.
- Facts live in `src/data/` (`profile.ts`, `projects.ts`), as `{ en, fr }`; interface words in `src/i18n/{en,fr}.ts`. Charts and the map compute everything from the data: real data only, nothing typed in by hand.
- Design: tokens and themes in `src/styles/tokens.css` (`html[data-theme]`: midnight, daylight), shared pieces in `base.css`. Schibsted Grotesk + IBM Plex Mono. Amber `--signal` = activity, used sparingly.

## Commands

- `npm run dev` · `npm run build` · `npm run preview` (production headers)
- `npm run typecheck` · `npm test` (Vitest) · `npm run lint` (Oxlint + Stylelint) · `npm run format:check`
- `npm run test:e2e` (builds, then Playwright desktop + mobile) · `npm run cv:pdf` (after a build; fails if the CV leaves one A4 page)
- `npm run codemap` (also run by pre-commit)
- Done means: typecheck, lint, tests pass; e2e for UI changes; check the page in the browser for visual changes.

## Rules

- Content changes: EN and FR together (`dictionaries.test.ts` checks keys).
- New project: `src/data/projects.ts` + media in `public/projects/<id>/` (`media:*` scripts need ffmpeg). Everything else follows.
- Strict CSP (`vercel.json`, mirrored by `vite preview`): no inline `style=` / scripts / handlers in HTML. Set styles from JS via the CSSOM. The head script is allowed by hash: editing it means updating the hash (`headers.test.ts` prints it).
- Content must stay readable without JS (reveals only hide under `html.js`); respect `prefers-reduced-motion`.
- Oxlint bans `Array#sort` (`toSorted` is unavailable too: lib is ES2020; pick with a loop or `reduce`), shadowed names, and inner functions that capture nothing (move them to module scope).
- Don't edit generated output: `dist/`, `cv-pdf/`, `test-results/`, `graphify-out/`, `.claude/codemap.md`.
- Prettier: 4 spaces, 120 cols, single quotes, no trailing commas. Format touched files only.

## Git flow

- `main` = production (Vercel). `dev` = integration. Work on `feat/*`, `fix/*`, `chore/*` from `dev`, PR into `dev`; `dev` → `main` to release.
- Conventional commits (`feat(home): ...`). Pre-commit runs lint-staged, typecheck, tests, codemap; never `--no-verify`.
- The `cv` GitHub release must stay "Latest" (`/cv.pdf` redirects to it). `v1-classic` = old site, tag `prototype-redesign` = design prototypes.
