/**
 * CV blocks, rendered at build time in every language (src/pages/content/render.ts calls them for the matching
 * data-render names). The same HTML is the web page and, printed by scripts/cv-pdf.ts, the PDF.
 * Relative imports only: rendered from Node.
 */
import { CV_PROJECTS, EDUCATION, EXPERIENCES, LOCATION, SKILLS, type Education } from '../../data/profile.ts';
import { PROJECTS, projectPath } from '../../data/projects.ts';
import { OWNER, SITE } from '../../core/site.ts';
import { localizedPath, lookup, type Lang } from '../../core/translate.ts';

/**
 * Line breaks that read badly on paper: "191 ± 41" always stays whole; in French a non-breaking space also goes
 * before ; : ! ? % », after «, and inside numbers (1 406). Text with links goes through it too: attribute values
 * never have a space before these signs.
 */
export const typeset = (lang: Lang, text: string) => {
    const kept = text.replace(/ ± /g, '\u00a0±\u00a0');
    return lang === 'fr'
        ? kept
              .replace(/ ([;:!?%»])/g, '\u00a0$1')
              .replace(/« /g, '«\u00a0')
              .replace(/(\d) (?=\d{3}\b)/g, '$1\u00a0')
        : kept;
};

/** Title on the left, a date or tags on the right. */
const head = (title: string, aside = '') =>
    `<div class="cv-entry-head"><h3>${title}</h3>${aside ? `<span class="cv-aside">${aside}</span>` : ''}</div>`;

export const experience = (lang: Lang) =>
    EXPERIENCES.map(
        (
            e
        ) => `<div class="cv-entry">${head(e.title[lang], e.period[lang])}${e.org ? `<p class="cv-org">${e.org}</p>` : ''}
<ul>${e.highlights.map((h) => `<li>${typeset(lang, h[lang])}</li>`).join('')}</ul></div>`
    ).join('');

export const skills = (lang: Lang) =>
    SKILLS.map(
        // A skill never breaks, and the dot stays with the skill before it: lines only break between skills
        (g) =>
            `<div class="cv-group"><h3>${g.title[lang]}</h3><p>${g.items.map((i) => `<span class="cv-skill">${i}</span>`).join('&nbsp;· ')}</p></div>`
    ).join('');

/** Certifications are not studies: they get their own short list. */
const CERT_IDS = new Set(['google-cloud']);

const schoolEntry = (lang: Lang, e: Education) =>
    `<div class="cv-entry">${head(e.cvTitle[lang], e.cvHidePeriod ? '' : e.period[lang])}<p>${typeset(lang, e.cvSummary[lang])}</p></div>`;

export const education = (lang: Lang) =>
    EDUCATION.filter((e) => !CERT_IDS.has(e.id))
        .map((e) => schoolEntry(lang, e))
        .join('');

export const certifications = (lang: Lang) =>
    EDUCATION.filter((e) => CERT_IDS.has(e.id))
        .map((e) => schoolEntry(lang, e))
        .join('');

/** A project's title, linked to its page (clickable in the PDF too). */
const projectLink = (id: string, lang: Lang) => {
    const project = PROJECTS.find((p) => p.id === id);
    return project ? `<a href="${SITE}${localizedPath(projectPath(id), lang)}">${project.title}</a>` : id;
};

/** One block per project column: the title (two linked projects when grouped), its tags on their own line, then the summary. */
export const projectBlocks = Object.fromEntries(
    CV_PROJECTS.map((group) => [
        `cv-projects-${group.id}`,
        (lang: Lang) =>
            `<div>${group.projects
                .map((entry) => {
                    const title = [entry.id, ...(entry.also ? [entry.also] : [])]
                        .map((id) => projectLink(id, lang))
                        .join(' &amp; ');
                    return `<div class="cv-entry">${head(title)}<p class="cv-aside">${entry.tags.join(' · ')}</p><p>${typeset(lang, entry.summary[lang])}</p></div>`;
                })
                .join('')}</div>`
    ])
);

/** Location, then email, site, GitHub, LinkedIn. */
export const contact = (lang: Lang) =>
    `<li>${LOCATION[lang]}</li>` +
    [
        [`mailto:${OWNER.email}`, OWNER.email],
        [`${SITE}${localizedPath('/', lang)}`, SITE.replace('https://', '')],
        [OWNER.github, OWNER.github.replace('https://', '')],
        [OWNER.linkedin, OWNER.linkedin.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')]
    ]
        .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
        .join('');

/** QR code to the home page in the CV's language (public/qrcode*.svg), printed next to the contact list. */
export const QR_CODE: Record<Lang, string> = { en: '/qrcode.svg', fr: '/qrcode-fr.svg' };

export const qr = (lang: Lang) =>
    `<img src="${QR_CODE[lang]}" alt="${lookup(lang, 'cv.controls.qr')}" width="64" height="64" />`;
