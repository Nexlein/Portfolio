/**
 * Render the site's data into the pages at build time (home, CV, nav and footer everywhere).
 * Templates mark where content goes with data-render="<block>"; entries are appended there.
 * Relative imports only: vite-plugins/pages.ts runs this from Node, without the '@/' alias.
 */
import type { Lang } from '../../core/translate.ts';
import { renderNav } from '../../components/Nav/render.ts';
import { renderFooter } from '../../components/Footer/render.ts';
import * as home from '../home/blocks.ts';
import * as cv from '../cv/blocks.ts';

/** `path` is the page being rendered, in the default language ('/', '/cv.html'). */
type Block = (lang: Lang, path: string) => string;

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
    method: home.method,
    'method-source': home.methodSource,
    hire: home.hire,
    contact: home.contact,
    email: home.email,

    // CV (src/pages/cv/blocks.ts)
    'cv-contact': cv.contact,
    'cv-experience': cv.experience,
    'cv-skills': cv.skills,
    'cv-education': cv.education,
    'cv-toolbox': cv.toolbox,
    ...cv.projectBlocks
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
