/**
 * Render src/data/profile.ts into the pages at build time (home timeline, CV, availability).
 * Templates mark where content goes with data-render="<block>"; entries are appended there.
 * Relative imports only: vite-plugins/pages.ts runs this from Node, without the '@/' alias.
 */
import { CV_PROJECTS, EDUCATION, EXPERIENCES, OFFERS, SKILLS, TIMELINE } from '../../data/profile.ts';
import type { Education, Experience, Offer, Text } from '../../data/profile.ts';
import { PROJECTS } from '../../data/projects.ts';
import type { Lang } from '../../core/translate.ts';

type Block = (lang: Lang) => string;

const tags = (items: string[], cls = '') =>
    `<div class="${cls}">${items.map((t) => (cls === 'tags' ? `<span class="tag">${t}</span>` : `<span>${t}</span>`)).join('')}</div>`;

/** Spacing class on every entry but the last, as in the original markup. */
const spaced = <T>(items: T[], cls: string, render: (item: T) => string) =>
    items.map((item, i) => `<div${i < items.length - 1 ? ` class="${cls}"` : ''}>${render(item)}</div>`).join('');

function timelineItem(entry: Experience | Education, lang: Lang): string {
    const org = 'org' in entry && entry.org ? ` <span class="highlight">@ ${entry.org}</span>` : '';
    const entryTags = 'tags' in entry && entry.tags ? tags(entry.tags, 'tags') : '';
    return `<div class="timeline-item"><div class="timeline-marker"></div><div class="timeline-content">
<div class="timeline-date">${entry.period[lang]}</div>
<h3 class="timeline-title">${entry.title[lang]}${org}</h3>
<p class="timeline-desc">${entry.summary[lang]}</p>${entryTags}
</div></div>`;
}

const OFFER_ICONS: Record<Offer['id'], string> = {
    'full-time': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    freelance: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>'
};

function offerCard(offer: Offer, lang: Lang): string {
    const rows = offer.rows
        .map(
            (row) => `<div><div class="avail-lbl lbl-${offer.id}">${row.label[lang]}</div>
<div class="text-primary-md">${row.value[lang]}<br /><span class="text-muted-sm">${row.note[lang]}</span></div></div>`
        )
        .join('');
    return `<div class="card card-availability card-${offer.id}">
<div class="flex-row-center"><div class="avail-icon-box icon-box-${offer.id}">
<svg class="icon-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${OFFER_ICONS[offer.id]}</svg></div>
<div><h2 class="text-primary-lg">${offer.title[lang]}</h2><p class="description text-sm">${offer.summary[lang]}</p></div></div>
<div class="flex-col-gap">${rows}</div></div>`;
}

const byId = new Map<string, Experience | Education>([...EXPERIENCES, ...EDUCATION].map((e) => [e.id, e]));
const text = (t: Text, lang: Lang) => t[lang];

/** Every block a template can ask for. */
export const BLOCKS: Record<string, Block> = {
    timeline: (lang) => TIMELINE.map((id) => timelineItem(byId.get(id)!, lang)).join(''),

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
        ),

    offers: (lang) => OFFERS.map((offer) => offerCard(offer, lang)).join('')
};

/** Append every [data-render] block of the page, in `lang`. Unknown blocks are an error, not a silent gap. */
export function renderContent(document: Document, lang: Lang): void {
    document.querySelectorAll<HTMLElement>('[data-render]').forEach((el) => {
        const name = el.getAttribute('data-render')!;
        const block = BLOCKS[name];
        if (!block) throw new Error(`Unknown data-render block "${name}"`);
        el.insertAdjacentHTML('beforeend', block(lang));
    });
}
