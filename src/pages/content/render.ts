/**
 * Render the site's data into the pages at build time (home, CV, nav and footer everywhere).
 * Templates mark where content goes with data-render="<block>"; entries are appended there.
 * Relative imports only: vite-plugins/pages.ts runs this from Node, without the '@/' alias.
 */
import { CV_PROJECTS, EDUCATION, EXPERIENCES, SKILLS } from '../../data/profile.ts';
import type { Text } from '../../data/profile.ts';
import { PROJECTS } from '../../data/projects.ts';
import type { Lang } from '../../core/translate.ts';
import { renderNav } from '../../components/Nav/render.ts';
import { renderFooter } from '../../components/Footer/render.ts';
import * as home from '../home/blocks.ts';

/** `path` is the page being rendered, in the default language ('/', '/cv.html'). */
type Block = (lang: Lang, path: string) => string;

const tags = (items: string[], cls = '') =>
    `<div class="${cls}">${items.map((t) => (cls === 'tags' ? `<span class="tag">${t}</span>` : `<span>${t}</span>`)).join('')}</div>`;

/** Spacing class on every entry but the last, as in the original markup. */
const spaced = <T>(items: T[], cls: string, render: (item: T) => string) =>
    items.map((item, i) => `<div${i < items.length - 1 ? ` class="${cls}"` : ''}>${render(item)}</div>`).join('');

const text = (t: Text, lang: Lang) => t[lang];

/** Every block a template can ask for. */
export const BLOCKS: Record<string, Block> = {
    nav: (lang, path) => renderNav(lang, path),
    footer: (lang) => renderFooter(lang),

    // Home (src/pages/home/blocks.ts)
    availability: home.availability,
    featured: home.featured,
    'work-title': home.workTitle,
    'domain-query': home.domainQuery,
    'project-list': home.projectList,
    'map-more': home.mapMore,
    'path-chart': home.pathBlock,
    experience: home.experience,
    numbers: home.numbersBlock,
    hire: home.hire,
    contact: home.contact,
    email: home.email,

    'cv-experience': (lang) =>
        EXPERIENCES.map(
            (exp, i) => `<div${i > 0 ? ' class="mt-16"' : ''}>
<div class="flex-row-justify-space-between"><h3>${exp.title[lang]}</h3><span class="text-12px-color-text-muted">${exp.period[lang]}</span></div>
${exp.org ? `<div class="text-13px-color-accent-blue">${exp.org}</div>` : ''}
<ul>${exp.highlights.map((h) => `<li>${text(h, lang)}</li>`).join('')}</ul></div>`
        ).join(''),

    'cv-skills': (lang) =>
        spaced(
            SKILLS,
            'mb-16',
            (group) =>
                `<h3 class="text-13px-color-accent-blue mb-4">${group.title[lang]}</h3>${tags(group.items, 'tech-tags')}`
        ),

    ...Object.fromEntries(
        CV_PROJECTS.map((group): [string, Block] => [
            `cv-projects-${group.id}`,
            (lang) =>
                spaced(group.projects, 'mb-16', (entry) => {
                    const project = PROJECTS.find((p) => p.id === entry.id);
                    return `<h3>${entry.title ?? project?.title ?? entry.id}</h3><p>${entry.summary[lang]}</p>${tags(entry.tags, 'tech-tags')}`;
                })
        ])
    ),

    'cv-education': (lang) =>
        spaced(
            EDUCATION,
            'mb-12',
            (edu) =>
                `<h3>${edu.cvTitle[lang]}</h3>${edu.cvHidePeriod ? '' : `<span class="text-12px-color-text-muted-1">${edu.period[lang]}</span>`}<p>${edu.cvSummary[lang]}</p>`
        )
};

/** Append every [data-render] block of the page, in `lang`. Unknown blocks are an error, not a silent gap. */
export function renderContent(document: Document, lang: Lang, path = '/'): void {
    document.querySelectorAll<HTMLElement>('[data-render]').forEach((el) => {
        const name = el.getAttribute('data-render')!;
        const block = BLOCKS[name];
        if (!block) throw new Error(`Unknown data-render block "${name}"`);
        el.insertAdjacentHTML('beforeend', block(lang, path));
    });
}
