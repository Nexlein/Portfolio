/**
 * CV blocks, rendered at build time in every language (src/pages/content/render.ts calls them for the matching
 * data-render names). The same HTML is the web page and, printed by scripts/cv-pdf.mjs, the PDF.
 * Relative imports only: rendered from Node.
 */
import { CV_PROJECTS, EDUCATION, EXPERIENCES, SKILLS } from '../../data/profile.ts';
import { PROJECTS, projectPath } from '../../data/projects.ts';
import { OWNER, SITE } from '../../core/site.ts';
import { localizedPath, lookup, type Lang } from '../../core/translate.ts';
import { learnedSince, skillSeries, thisMonth } from '../../components/Charts/data.ts';
import { PATH, pathSamples } from '../../components/Charts/render.ts';

const t = (lang: Lang, key: string) => lookup(lang, `cv.${key}`);

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

export const education = (lang: Lang) =>
    EDUCATION.map(
        (e) =>
            `<div class="cv-entry">${head(e.cvTitle[lang], e.cvHidePeriod ? '' : e.period[lang])}<p>${e.cvSummary[lang]}</p></div>`
    ).join('');

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
        [OWNER.linkedin, t(lang, 'links.linkedin')]
    ]
        .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
        .join('');

/** The skill toolbox as a sparkline: the home's path chart, at CV size. */
export function toolbox(lang: Lang): string {
    const now = thisMonth();
    const points = skillSeries(PROJECTS, now);
    const total = points[points.length - 1].v;
    const line = pathSamples(points, points[0].t, now, total)
        .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
        .join('');
    const { W, H, B } = PATH;
    return `<p class="cv-toolbox-k"><strong>${t(lang, 'toolbox.total').replace('{n}', String(total))}</strong>
<span>${t(lang, 'toolbox.recent').replace('{n}', String(learnedSince(PROJECTS, now).length))}</span></p>
<svg class="cv-spark" viewBox="0 30 ${W} ${H - 30}" preserveAspectRatio="none" aria-hidden="true">
<path class="cv-spark-area" d="${line}L${W - PATH.R} ${H - B}L${PATH.L} ${H - B}Z" /><path class="cv-spark-line" d="${line}" /></svg>`;
}
