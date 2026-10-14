# Portfolio

[![CI](https://github.com/Nexlein/Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/Nexlein/Portfolio/actions/workflows/ci.yml)

Personal software engineering portfolio of Nielsen COMBE--BRACCIALE. Built with vanilla TypeScript and Vite, deployed on Vercel. Content is available in English and French.

## Pages

| Page            | Template       | Entry script                   | URL                         |
| --------------- | -------------- | ------------------------------ | --------------------------- |
| Home            | `index.html`   | `src/pages/home/home.ts`       | `/`                         |
| CV              | `cv.html`      | `src/pages/cv/cv.ts`           | `/cv.html` (PDF: `/cv.pdf`) |
| Project (× all) | `project.html` | `src/pages/project/project.ts` | `/projects/<id>.html`       |

Every page also exists in French under `/fr/`. `/availability.html` redirects to the home page's `#hire` section.

The home page is one scroll: hero (a live simulation), selected work, every project on the neural map, the path chart, the numbers, and the two ways to hire. Project pages go deeper on one project; the CV is the printable format.

Unknown addresses get `404.html` (Vercel serves it with status 404 at the address that was asked for; there is one file, so the English one). It is not in the sitemap and is marked `noindex`. Under `/fr/` the head script moves the visitor to `/fr/404.html`, the French copy of the same page; `data-static` on the page keeps the language redirect from looping.

## Getting started

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
npm run dev
```

## Scripts

| Script                  | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                                        |
| `npm run build`         | Typecheck and build to `dist/`                                   |
| `npm run preview`       | Serve the production build locally                               |
| `npm run typecheck`     | Run `tsc --noEmit`                                               |
| `npm test`              | Run Vitest                                                       |
| `npm run lint`          | Lint TS (Oxlint) and CSS (Stylelint)                             |
| `npm run lint:fix`      | Lint and autofix                                                 |
| `npm run media:posters` | Generate missing video posters (ffmpeg)                          |
| `npm run media:og`      | Generate missing per-project social images (ffmpeg)              |
| `npm run media:brand`   | Redraw the home social image and the icons (Chromium, no ffmpeg) |
| `npm run media:video`   | Re-encode a video for the web (ffmpeg)                           |
| `npm run audit`         | Dependency audit (`config/audit-ci.jsonc`)                       |
| `npm run format`        | Format all files with Prettier                                   |
| `npm run format:check`  | Check formatting without writing                                 |

## Project structure

```
src/
├── components/       One folder per UI feature; internals stay inside it
│   ├── Charts/       Path chart and numbers bento: data (pure), SVG render (build time), interactions
│   ├── Footer/       Site footer (build time)
│   ├── Hero/         Hero canvas and its simulations (sims/)
│   ├── Nav/          Top nav (build time) + pill, theme menu (Nav.ts)
│   └── NeuralMap/    Project map: similarity and layout (graph.ts, pure), canvas and cards (NeuralMap.ts)
├── core/             Site facts, translation, structured data, analytics
├── data/             Site content: profile.ts (experience, education, skills, offers, checkpoints) and projects.ts
├── i18n/             Interface text (en, fr)
├── pages/            Per-page blocks, entry scripts and styles (home, cv, project); content/render.ts maps blocks
├── styles/           Design tokens and themes (tokens.css), base styles (base.css)
└── ui/               Shared helpers (SVG icons, lazy videos)
public/
└── projects/         Project media (images, videos), one folder per project id
```

Conventions:

- Import across folders with the `@/` alias (`@/core/i18n`), within a folder with `./`. Modules the build runs from Node (blocks, render, data) use relative `.ts` imports instead.
- HTML templates stay at the repo root so their URLs (`/cv.html`) don't change.
- Tags every page needs in `<head>` (favicon, theme and language script) are injected by the `sharedHead` plugin in `vite-plugins/shared-head.ts`.
- Themes (Midnight, Daylight) are sets of CSS custom properties on `html[data-theme]` in `src/styles/tokens.css`. To add one: add its block there, its id to `src/components/Nav/themes.ts`, a swatch in `Nav.css` and its name in both dictionaries.

## Adding a project

1. Put the media in `public/projects/<id>/` (see Media).
2. Add a `ProjectEntry` to `src/data/projects.ts`: title, `{ en, fr }` description, tags, category, start month (`date`), and `featured: true` for the three on the home page.
3. Run `npm run media:og` for its social image.

The map, the list, the charts, the counts, its page, the sitemap and the structured data follow.

### Browser tests

Playwright (`e2e/`) runs desktop and mobile Chromium against the production build, served by `vite preview` with the production headers. Scenarios: every page loads with its fonts and no console errors, CSP violations or third-party requests; content without JavaScript; the project map (hover, click, domains) and the phone list; hero switch; path chart and numbers cards; copy email; themes; the EN/FR switch and first visit from a French browser; reduced motion; project pages (video, gallery, connected projects, back link); the CV PDF link. Any console error fails the test.

## Languages (EN / FR)

Every page exists in both languages, with its own URL: `/cv.html` and `/fr/cv.html`. The `sitePages` plugin (`vite-plugins/pages.ts`) renders each page once per language: text from `src/i18n/{en,fr}.ts`, `<html lang>`, title, description, Open Graph tags, canonical URL and `hreflang` alternates. Search engines and link previews (which don't run JavaScript) see real French pages. The dev server renders `/fr/*` on the fly.

- The URL decides the language. The EN/FR toggle opens the same page in the other language and remembers the choice.
- First visit from a French browser to an English page: an inline script redirects to the French page before first paint. Shared `/fr/` links always stay French, and a remembered choice wins.
- Page titles and descriptions live under `meta.*` in the dictionaries. The few strings scripts write at runtime (toasts, button labels) use `i18n.t()`.

## Content

Facts live in data files, written once with English and French side by side (`{ en, fr }`, a missing language is a type error):

- `src/data/profile.ts`: experiences, education, skills, the projects the CV highlights, the internship and freelance offers, and the checkpoints on the path chart.
- `src/data/projects.ts`: projects.

Templates mark where content goes with `data-render="<block>"` (home sections, CV sections); `src/pages/content/render.ts` fills them at build time, so crawlers and the CV PDF see real text. `src/i18n/{en,fr}.ts` only holds interface text (navigation, headings, buttons). Text may use `<strong>`/`<br>`, never CSS classes.

To add a job: append it to `EXPERIENCES`. It appears under the path chart, on the CV and in the CV PDF. Milestones without a project (school, certifications) go in `CHECKPOINTS` and show on the path chart.

The path chart opens on Max; its buttons (1M, 6M, 1Y, Max, in `RANGES` in `src/components/Charts/data.ts`) change the headline (skills gained and the percentage over that range) and zoom the height on what changed. Steps are whole months, so there is no 1D or 1W. The band along its bottom counts Epitech school years (September to August) from the date of the `epitech` checkpoint: keep that checkpoint.

## Project pages

Every project in `src/data/projects.ts` gets its own page, `/projects/<id>.html` and `/fr/projects/<id>.html`, rendered at build time from `project.html` (`src/pages/project/render.ts`): media, specs, and the three projects the map links it to. Adding a project adds its page, sitemap entry and structured data automatically; it only needs a social image: run `npm run media:og` (creates `public/projects/<id>/og.jpg`, 1200×630).

All pages come from one list in `vite-plugins/pages.ts` (`PAGES`): path, template, title, description, social image and JSON-LD per page, rendered in every language. `sitemap.xml` is generated from the same list.

## SEO and social previews

Each page declares its own description, canonical URL and Open Graph / X tags in its `<head>`. Titles and descriptions come from `meta.*` in the dictionaries (see Languages). All pages share `public/og-image.png` (1200×630, a screenshot of the home hero). `public/robots.txt` and the generated `sitemap.xml` point crawlers at `https://nexlein.vercel.app`.

When adding a page, give it these tags and a sitemap entry; `src/pages/seo.test.ts` fails until you do.

## Tests

Vitest, colocated as `*.test.ts` next to the code they cover. DOM tests opt into happy-dom with a `// @vitest-environment happy-dom` header.

- `src/i18n/dictionaries.test.ts`: en/fr key parity, no empty strings, every `data-i18n` key used exists.
- `src/data/*.test.ts`: unique ids, media files and formats, dates, featured projects, checkpoints.
- `src/components/NeuralMap/graph.test.ts`: the map layout never overlaps, today and at 40 projects.
- `src/pages/content/render.test.ts`: every template block exists and renders (home, CV).
- `src/pages/pages.test.ts`, `src/pages/seo.test.ts`: every page in every language, meta tags, structured data, sitemap.
- `src/pages/headers.test.ts`: CSP, security headers, redirects, no inline styles or scripts in templates.

The CV PDF (`npm run cv:pdf`, after a build) fails if the CV no longer fits on one A4 page.

## Media

Project media lives in `public/projects/<id>/` and must be web-ready (a test enforces the formats):

- **Images**: WebP, at most 1200px on the long side (`ffmpeg -i in.png -vf "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease" -quality 80 out.webp`).
- **Videos**: H.264 MP4 without audio, at most 960px wide, `faststart`. Run `npm run media:video -- public/projects/<id>/<name>.mp4` to re-encode in place.
- **Posters**: every video needs `<name>.poster.webp`. Run `npm run media:posters` to generate missing ones.

Videos load nothing until they scroll into view (`preload="none"` + an IntersectionObserver in `src/ui/video.ts`) and pause off screen. With `prefers-reduced-motion` they never autoplay: they keep their poster and show controls.

Fonts are self-hosted with Fontsource (latin subset), so pages make no third-party requests.

## Analytics

[Vercel Web Analytics](https://vercel.com/docs/analytics): cookie-free page views, so no consent banner. `src/core/analytics.ts` loads Vercel's same-origin script only in builds made on Vercel (`IS_VERCEL_BUILD`, from the `VERCEL` env var); local and CI builds never load it.

To turn it on: Vercel dashboard → Project → Analytics → Enable.

## Security headers

`vercel.json` sets the production headers: a strict Content-Security-Policy (our own origin only, no `unsafe-inline`), `nosniff`, no framing at all (`frame-ancestors 'none'`, `DENY`), a strict referrer policy and a restrictive `Permissions-Policy`. Hashed files in `/assets/` are cached for a year; project media for a day.

`npm run preview` serves the build with the same headers, so CSP problems show up locally.

Because of the CSP:

- No inline `style="…"` attributes, inline event handlers or inline `<script>` in the HTML pages (`src/pages/headers.test.ts` enforces it). Use classes and modules.
- The only inline code is the head script (theme, language redirect) in `vite-plugins/shared-head.ts`, allowed by its sha256 hash. Editing it changes the hash: update `vercel.json` (the test prints the expected value).
- New third-party origins (analytics, embeds, CDNs) must be added to the matching CSP directive.

## Quality checks

- **Pre-commit** (Husky + lint-staged): Oxlint/Stylelint autofix and Prettier on staged files, then typecheck and tests.
- **CI** (GitHub Actions, on PRs and `main`): dependency audit, format check, lint, typecheck, tests, build; then browser tests and Lighthouse on the built site.
- **Linting**: [Oxlint](https://oxc.rs) for TypeScript (`.oxlintrc.json`; chosen over ESLint because typescript-eslint does not support TypeScript 7), [Stylelint](https://stylelint.io) for CSS (`.stylelintrc.json`).
- **Audit**: fails on high/critical advisories. Accepted exceptions live in `config/audit-ci.jsonc`, each with a reason.
- **Lighthouse** (CI job after the build): audits the main pages and one project page, in both languages (list in `config/lighthouserc.json`). Accessibility, best practices and SEO must score at least 95; performance below 80 warns. Thresholds live in `lighthouserc.json`; reports are uploaded as a workflow artifact.
- **Dependabot**: weekly npm and GitHub Actions updates.
- **Deploy**: Vercel builds previews for PRs and production from `main`.
- **Uptime** (`.github/workflows/uptime.yml`, every 6 hours): checks that production answers (home, French home, sitemap, a project page, both 404s, both CV links reach a PDF). A failure fails the run, and GitHub emails the owner. Weekly rebuild: `.github/workflows/rebuild.yml`.
