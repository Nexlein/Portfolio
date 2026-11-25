# ADR 0008: Content as typed bilingual data

- Status: Accepted
- Date: 2026-10-07
- Links: [#19](https://github.com/Nexlein/Portfolio/pull/19); data-driven redesign [#20](https://github.com/Nexlein/Portfolio/pull/20)

## Context

[#19](https://github.com/Nexlein/Portfolio/pull/19): "Experience, education, skills and availability were hard-coded in the HTML and duplicated in both dictionaries (4 copies per fact), and had drifted".

## Decision

- `src/data/profile.ts` and `src/data/projects.ts` hold every fact once, English and French side by side (`{ en, fr }`): a missing language is a type error.
- The dictionaries (`src/i18n/`) hold interface words only.
- Since the redesign ([#20](https://github.com/Nexlein/Portfolio/pull/20)), the map, charts, counts and lists are computed from the data. Real data only: nothing in a chart is typed in by hand.

## Consequences

- A new project is one entry plus its media ([content.md](../content.md#add-a-project)).
- Tests check the data itself: ids, dates, media, both languages.
- The CV, the social images and the JSON-LD read the same facts as the pages.
