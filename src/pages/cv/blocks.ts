/**
 * CV blocks, rendered at build time in every language (src/pages/content/render.ts calls them for the matching
 * data-render names). The same HTML is the web page and, printed by scripts/cv-pdf.ts, the PDF.
 * Relative imports only: rendered from Node.
 */
import { CV_PROJECTS, EDUCATION, EXPERIENCES, SKILLS } from '../../data/profile.ts';
import { PROJECTS, projectPath } from '../../data/projects.ts';
import { OWNER, SITE } from '../../core/site.ts';
import { localizedPath, type Lang } from '../../core/translate.ts';

/** Title on the left, a date or tags on the right. */
const head = (title: string, aside = '') =>
    `<div class="cv-entry-head"><h3>${title}</h3>${aside ? `<span class="cv-aside">${aside}</span>` : ''}</div>`;

export const experience = (lang: Lang) =>
    EXPERIENCES.map(
        (
            e
        ) => `<div class="cv-entry">${head(e.title[lang], e.period[lang])}${e.org ? `<p class="cv-org">${e.org}</p>` : ''}
<ul>${e.highlights.map((h) => `<li>${h[lang]}</li>`).join('')}</ul></div>`
    ).join('');

export const skills = (lang: Lang) =>
    SKILLS.map((g) => `<div class="cv-group"><h3>${g.title[lang]}</h3><p>${g.items.join(' · ')}</p></div>`).join('');

/** Certifications are not studies: they get their own short list. */
const CERT_IDS = new Set(['google-cloud']);

export const education = (lang: Lang) =>
    EDUCATION.filter((e) => !CERT_IDS.has(e.id))
        .map(
            (e) =>
                `<div class="cv-entry">${head(e.cvTitle[lang], e.cvHidePeriod ? '' : e.period[lang])}<p>${e.cvSummary[lang]}</p></div>`
        )
        .join('');

export const certifications = (lang: Lang) =>
    EDUCATION.filter((e) => CERT_IDS.has(e.id))
        .map((e) => `<div class="cv-entry">${head(e.cvTitle[lang], e.period[lang])}<p>${e.cvSummary[lang]}</p></div>`)
        .join('');

/** One block per project column; titles link to the project page (clickable in the PDF too). */
export const projectBlocks = Object.fromEntries(
    CV_PROJECTS.map((group) => [
        `cv-projects-${group.id}`,
        (lang: Lang) =>
            group.projects
                .map((entry) => {
                    const project = PROJECTS.find((p) => p.id === entry.id);
                    const title = entry.title ?? project?.title ?? entry.id;
                    const linked = project
                        ? `<a href="${SITE}${localizedPath(projectPath(project.id), lang)}">${title}</a>`
                        : title;
                    return `<div class="cv-entry">${head(linked, entry.tags.join(' · '))}<p>${entry.summary[lang]}</p></div>`;
                })
                .join('')
    ])
);

/** Email, site, GitHub, LinkedIn. */
export const contact = (lang: Lang) =>
    [
        [`mailto:${OWNER.email}`, OWNER.email],
        [`${SITE}${localizedPath('/', lang)}`, SITE.replace('https://', '')],
        [OWNER.github, OWNER.github.replace('https://', '')],
        [OWNER.linkedin, OWNER.linkedin.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')]
    ]
        .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
        .join('');
