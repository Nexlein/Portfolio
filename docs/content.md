# Content

Facts live once, in `src/data/`, with English and French side by side (`{ en, fr }`; a missing language is a type error). Charts, the project map, counts, the CV, the social images and the JSON-LD are computed from them ([ADR 0008](adr/0008-content-as-data.md)).

## What lives where

| Content                                  | Where                                  | Shows on                                                   |
| ---------------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Jobs                                     | `EXPERIENCES` in `src/data/profile.ts` | CV, CV PDF, story under the path chart                     |
| Education                                | `EDUCATION`                            | CV, home                                                   |
| Path chart milestones                    | `CHECKPOINTS`                          | path chart and its story                                   |
| What is happening now, availability      | `NOW`                                  | home, project map, social images                           |
| City                                     | `LOCATION`                             | CV                                                         |
| CV skills                                | `SKILLS`                               | CV, JSON-LD                                                |
| Projects the CV lists                    | `CV_PROJECTS`                          | CV                                                         |
| Projects                                 | `PROJECTS` in `src/data/projects.ts`   | map, list, charts, counts, project pages, sitemap, JSON-LD |
| How tags become skills                   | `src/data/skills.ts`                   | map similarity, chart counts, "Shares..." on project pages |
| Interface words (nav, headings, buttons) | `src/i18n/{en,fr}.ts`                  | every page                                                 |
| Site URL, owner name                     | `src/core/site.ts`                     | every page, JSON-LD                                        |

## Rules

- EN and FR change together. Write native French, not a word-for-word copy of the English.
- Real data only: charts and the map compute everything from the data; nothing typed in by hand.
- No AI clichés. ASCII hyphens in date ranges (`2024-2026`).
- The name is spelled `COMBE--BRACCIALE`.
- Team projects: never "I built X". Say the team size and your own part (`team.role`).
- Texts may use `<strong>` and `<br>`, never classes or styles (`src/data/profile.test.ts`).
- One spelling per skill across projects (`src/data/projects.test.ts`).
- A `/` splits a tag into skills (`C/C++` is two), except the names in `WHOLE` (`CI/CD`). `ALIASES` maps other names (`RL`).
- A CV skill label with `/` or `(` needs an entry in `SKILL_ENTITIES` (`src/core/structured-data.ts`), so search engines get real names.
- French non-breaking spaces (before `; : ! ? %`, inside numbers) are added by the CV only (`typeset` in `src/pages/cv/blocks.ts`).

## Recipes

### Add a project

1. Media in `public/projects/<id>/` (see [Media](#media)).
2. A `ProjectEntry` in `PROJECTS`:

    | Field         | Value                                                    |
    | ------------- | -------------------------------------------------------- |
    | `id`, `title` | URL id, display name                                     |
    | `description` | `{ en, fr }`                                             |
    | `tags`        | skills, one spelling each                                |
    | `category`    | one of `DOMAINS`                                         |
    | `year`        | one of `PERIODS` (`Tek1`, `Tek2`, `Tek3`, `Personal`)    |
    | `date`        | start month, `YYYY-MM` (path chart, "learned this year") |
    | `featured`    | `true` for the home page's "Selected work" (exactly 3)   |
    | `team`        | `{ size, role }`, from the repository's history          |
    | `result`      | one concrete outcome the repository shows                |
    | `github`      | full URL, or `''` to hide the link                       |
    | `media`       | `video`, `image` or `gallery`                            |

3. `npm run media`: poster, card copies and the 1200×630 social image `og.jpg`.

Its page, map node, list entry, counts, sitemap entry and JSON-LD follow. `src/data/projects.test.ts` checks ids, media files and formats, texts in both languages.

### Add a job or a milestone

1. A job: append it to `EXPERIENCES`. It shows on the CV and the CV PDF.
2. To show it on the path chart and its story, add a `CHECKPOINTS` entry. Milestones without a project (school, certifications) work the same way.
3. Keep the `epitech` checkpoint: the chart's school-year band counts from it.

The path chart's ranges (1M, 6M, 1Y, Max) are `RANGES` in `src/components/Charts/data.ts`. Steps are whole months.

### Update the profile or the CV

1. Edit `src/data/profile.ts` (and the dictionaries for interface words).
2. `npm run media:brand` if availability, city, school or role changed: it redraws `public/og-image.png`, `og-image-fr.png`, `favicon.png` and `apple-touch-icon.png` from `NOW`, `OWNER` and the dictionaries. These files are committed outputs, not rebuilt on deploy.
3. `npm run build`, then `npm run cv:pdf`: it fails if the CV no longer fits on one A4 page.

### Retire or rename a project

1. Remove or rename it in `PROJECTS` and `public/projects/<id>/`.
2. A retired URL: add its id to the redirect pattern in `vercel.json` (`/projects/:id(...)` → `/#work`, and the `/fr/` twin).
3. `zappy` is the canary page. Renaming or retiring it means updating every file that names it:

    | File                                                    | Uses it for                           |
    | ------------------------------------------------------- | ------------------------------------- |
    | `config/lighthouserc.json`                              | audited URLs (EN, FR)                 |
    | `.github/workflows/uptime.yml`                          | production probe (EN, FR)             |
    | `e2e/pages.spec.ts`                                     | page list, fonts, origin, overflow    |
    | `e2e/home-nav.spec.ts`                                  | nav and theme checks                  |
    | `src/pages/pages.test.ts`                               | project page and sitemap expectations |
    | `src/ui/video.test.ts`                                  | poster example                        |
    | `vite-plugins/pages.ts`, `src/components/Nav/render.ts` | comment examples                      |

    `git grep -l zappy` lists them.

## Media

Project media lives in `public/projects/<id>/` and must be web-ready. `src/data/projects.test.ts` checks types and that derived files exist, not sizes.

| Kind        | Format and limit                                                           | Made by                                                             |
| ----------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Image       | WebP, at most 1200 px on the long side                                     | by hand (`ffmpeg` below)                                            |
| Video       | H.264 MP4, no audio, at most 960 px wide, `faststart`                      | `npm run media:video -- public/projects/<id>/<name>.mp4` (in place) |
| Poster      | `<name>.poster.webp`, one per video                                        | `npm run media`                                                     |
| Card copies | `<name>.320.webp`, `<name>.640.webp` for a project whose still is an image | `npm run media`                                                     |
| Social      | `og.jpg`, 1200×630                                                         | `npm run media`                                                     |

```bash
# An image, resized to 1200 px at most
ffmpeg -i in.png -vf "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease" -quality 80 out.webp
# Redo derived files (only missing ones are made by default)
npm run media -- --force=posters,og
```

- Bernstein and Survivor use hand-made card crops of their composite image. `--force=thumbs` would replace them with plain downscales.
- QR codes: the CV prints `public/qrcode.svg` (home) and `public/qrcode-fr.svg` (French home). To redo one, run `uvx --from qrcode qr --factory=svg-path --error-correction=M <url>`, then keep the files' style: a white square under one black path.
