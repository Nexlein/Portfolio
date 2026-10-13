/**
 * Home page blocks, rendered at build time in every language (src/pages/content/render.ts calls them for the
 * matching data-render names). Everything a visitor reads is in the HTML; scripts only add motion and interaction.
 * Relative imports only: rendered from Node.
 */
import { CHECKPOINTS, EDUCATION, EXPERIENCES, NOW, OFFERS, type Checkpoint, type Offer } from '../../data/profile.ts';
import { PROJECTS, projectPath, type ProjectEntry } from '../../data/projects.ts';
import { OWNER } from '../../core/site.ts';
import { localizedPath, lookup, type Lang } from '../../core/translate.ts';
import { domainIcon } from '../../ui/icons.ts';
import { videoPoster } from '../../ui/video.ts';
import { monthName, numbers, pathChart } from '../../components/Charts/render.ts';
import { thisMonth, yearOf } from '../../components/Charts/data.ts';
import { pickShown } from '../../components/NeuralMap/graph.ts';

/** Most projects the map shows at once (the rest rotate in). */
export const MAP_MAX = 24;

const t = (lang: Lang, key: string) => lookup(lang, `home.${key}`);

export const still = (p: ProjectEntry) =>
    p.media.type === 'video'
        ? videoPoster(p.media.src)
        : p.media.type === 'image'
          ? p.media.src
          : p.media.images[0].src;

/** First sentence of the description. */
const oneLiner = (p: ProjectEntry, lang: Lang) => `${p.description[lang].split('. ')[0].replace(/\.$/, '')}.`;

const domainName = (lang: Lang, d: string) => t(lang, `domains.${d}`);

export function availability(lang: Lang): string {
    return NOW.availability[lang];
}

export function featured(lang: Lang): string {
    return PROJECTS.filter((p) => p.featured)
        .map(
            (p) => `<a class="feature surface reveal" href="${localizedPath(projectPath(p.id), lang)}">
<span class="feature-media"><img src="${still(p)}" alt="" loading="lazy" width="640" height="400" /></span>
<span class="feature-body"><span class="eyebrow">${domainName(lang, p.category)}</span><strong>${p.title}</strong></span></a>`
        )
        .join('');
}

/** "17 projects. / One network." as two masked lines. */
export function workTitle(lang: Lang): string {
    return `<span class="line"><span>${t(lang, 'work.title1').replace('{n}', String(PROJECTS.length))}</span></span><span class="line"><span class="recede">${t(lang, 'work.title2')}</span></span>`;
}

/** One button per domain present in the data, in a stable order. */
export function domainQuery(lang: Lang): string {
    const used = new Set(PROJECTS.map((p) => p.category as string));
    return ['ai', 'systems', 'architecture', 'graphical', 'devops']
        .filter((d) => used.has(d))
        .map((d) => `<button type="button" data-domain="${d}">${domainName(lang, d)}</button>`)
        .join('');
}

/** Every project, as a plain list: phones, no JavaScript, search engines, and "See all" under the map. */
export function projectList(lang: Lang): string {
    return PROJECTS.map(
        (
            p
        ) => `<li><a href="${localizedPath(projectPath(p.id), lang)}" data-domain="${p.category}"><span class="list-ico">${domainIcon(p.category)}</span>
<span class="list-txt"><strong>${p.title}</strong><span>${oneLiner(p, lang)}</span></span><span class="list-chev" aria-hidden="true">›</span></a></li>`
    ).join('');
}

/** "Showing 24 of 40, the rest rotate in." — only when the map cannot hold everything. */
export function mapMore(lang: Lang): string {
    const { shown } = pickShown(PROJECTS, MAP_MAX);
    if (shown.length === PROJECTS.length) return '';
    return `${t(lang, 'work.more').replace('{shown}', String(shown.length)).replace('{n}', String(PROJECTS.length))} <button type="button" class="see-all" aria-expanded="false">${t(lang, 'work.seeAll')}</button>`;
}

/** Entries of the path list that show at once; the earlier ones fold away (see initPathLinks). */
const EXP_SHOWN = 3;

/** Every checkpoint of the path chart as a list entry, oldest first like the chart; the latest few are open. */
export function experience(lang: Lang): string {
    const entries = [...EXPERIENCES, ...EDUCATION];
    const item = (c: Checkpoint) => {
        const e = entries.find((x) => x.id === c.id)!;
        const org = 'org' in e && e.org ? ` · ${e.org}` : '';
        const when = 'kind' in e ? e.period[lang] : monthName(yearOf(c.date), lang);
        const first = e.summary[lang]
            .split('. ')[0]
            .replace(/<[^>]+>/g, '')
            .replace(/\.$/, '');
        return `<li data-cp="${c.id}" tabindex="0"><span class="exp-when">${when}</span><span class="exp-what"><strong>${e.title[lang]}${org}</strong>
<span>${first}.</span></span></li>`;
    };
    const early = CHECKPOINTS.slice(0, -EXP_SHOWN).map(item).join(''),
        late = CHECKPOINTS.slice(-EXP_SHOWN).map(item).join('');
    if (!early) return `<ul>${late}</ul>`;
    const n = CHECKPOINTS.length - EXP_SHOWN;
    return `<button type="button" class="exp-toggle" aria-expanded="false" hidden data-more="${t(lang, 'path.earlier').replace('{n}', String(n))}" data-less="${t(lang, 'path.fewer')}">${t(lang, 'path.earlier').replace('{n}', String(n))}</button>
<div class="exp-fold"><ul>${early}</ul></div>
<ul>${late}</ul>`;
}

export const pathBlock = (lang: Lang) => pathChart(lang, PROJECTS, thisMonth());

export const numbersBlock = (lang: Lang) => numbers(lang, PROJECTS, thisMonth());

/** Pay and contract details, closed until a recruiter asks for them. */
const recruiterInfo = (o: Offer, lang: Lang) =>
    o.rows
        .filter((r) => r.recruiter)
        .map(
            (r) => `<details class="tile-more"><summary>${t(lang, 'hire.recruiters')}</summary>
<p>${r.value[lang]}</p><p class="tile-note">${r.note[lang]}</p></details>`
        )
        .join('');

/** The two ways to work together. */
export function hire(lang: Lang): string {
    return OFFERS.map(
        (o) => `<article class="tile surface reveal">
<p class="eyebrow">${t(lang, `hire.${o.id}`)}</p><h3>${o.title[lang]}</h3><p class="tile-lede">${o.summary[lang]}</p>
<dl>${o.rows
            .filter((r) => !r.recruiter)
            .map((r) => `<div><dt>${r.label[lang]}</dt><dd>${r.value[lang]}</dd></div>`)
            .join('')}</dl>
${recruiterInfo(o, lang)}
<a class="link" href="mailto:${OWNER.email}">${t(lang, `hire.cta.${o.id}`)} <span aria-hidden="true">›</span></a>
</article>`
    ).join('');
}

/** How I work: three practices in a thin strip; the link to the source of this site is the proof. */
export function method(lang: Lang): string {
    return (['test', 'agents', 'compound'] as const)
        .map(
            (id, i) => `<div class="method-item reveal">
<span class="method-n mono">0${i + 1}</span><h3>${t(lang, `method.${id}.title`)}</h3><p class="method-text">${t(lang, `method.${id}.body`)}</p>
</div>`
        )
        .join('');
}

/** Link to the repository, under the cards. */
export const methodSource = (lang: Lang) =>
    `<a class="link" href="${OWNER.source}">${t(lang, 'method.source')} <span aria-hidden="true">›</span></a>`;

/** Copy email, LinkedIn, CV. */
export function contact(lang: Lang): string {
    return `<button type="button" class="btn copy-email" data-email="${OWNER.email}">${t(lang, 'hire.copy')}</button>
<a class="link" href="${OWNER.linkedin}">LinkedIn <span aria-hidden="true">›</span></a>
<a class="link" href="${localizedPath('/cv.html', lang)}">CV <span aria-hidden="true">›</span></a>`;
}

export const email = () => OWNER.email;
