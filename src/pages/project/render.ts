/**
 * Fill the project page template (project.html) for one project, at build time.
 * Relative imports only: vite-plugins/pages.ts runs this from Node, without the '@/' alias.
 */
import { PROJECTS, projectPath, type ProjectEntry, type ProjectMedia } from '../../data/projects.ts';
import { attr } from '../../core/text.ts';
import { localizedPath, lookup, type Lang } from '../../core/translate.ts';
import { Icons, domainIcon } from '../../ui/icons.ts';
import { stillAttrs, videoPoster, videoType } from '../../ui/video.ts';
import { monthName } from '../../components/Charts/render.ts';
import { yearOf } from '../../components/Charts/data.ts';
import { neighbours, periodOf, skillSet } from '../../components/NeuralMap/graph.ts';

const t = (lang: Lang, key: string) => lookup(lang, `projectPage.${key}`);
const domainName = (lang: Lang, d: string) => lookup(lang, `home.domains.${d}`);

/** Plain-text description (dictionaries may contain inline HTML) for meta tags and JSON-LD. */
export function projectDescription(project: ProjectEntry, lang: Lang): string {
    return project.description[lang]
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** The media frame: a lazy video (started on screen by playVideosWhenVisible), an image, or a gallery. */
function mediaHtml(media: ProjectMedia, lang: Lang): string {
    switch (media.type) {
        case 'video':
            return `<video loop muted playsinline preload="none" poster="${videoPoster(media.src)}"><source src="${media.src}" type="${videoType(media.src)}"></video>`;
        case 'image':
            return `<img src="${media.src}" alt="${attr(media.alt[lang])}" />`;
        case 'gallery': {
            const n = media.images.length;
            const images = media.images
                .map(
                    (img, i) =>
                        `<img src="${img.src}" alt="${attr(img.alt[lang])}" data-idx="${i}"${i ? ' loading="lazy" hidden aria-hidden="true"' : ' class="active"'} />`
                )
                .join('');
            const dots = media.images
                .map(
                    (_, i) =>
                        `<button type="button" data-idx="${i}" aria-label="${t(lang, 'image')
                            .replace('{i}', String(i + 1))
                            .replace('{n}', String(n))}"${i ? '' : ' aria-current="true"'}></button>`
                )
                .join('');
            return `<div class="gallery" role="group" aria-roledescription="carousel" aria-label="${t(lang, 'gallery')}">${images}
<button type="button" class="gallery-btn prev" aria-label="${t(lang, 'prev')}">${Icons.Prev}</button>
<button type="button" class="gallery-btn next" aria-label="${t(lang, 'next')}">${Icons.Next}</button>
<div class="gallery-dots">${dots}</div><p class="gallery-count mono" aria-live="polite">1 / ${n}</p></div>`;
        }
    }
}

/** Started, domain, period, team (when known), stack: the facts, as a spec strip. */
function specs(project: ProjectEntry, lang: Lang): string {
    const { team } = project;
    const rows: [string, string][] = [
        [t(lang, 'started'), monthName(yearOf(project.date), lang)],
        [t(lang, 'domain'), domainName(lang, project.category)],
        [t(lang, 'period'), lookup(lang, `home.work.periods.${periodOf(project)}`)],
        ...(team
            ? [
                  [
                      t(lang, 'team'),
                      team.size === 1 ? t(lang, 'solo') : t(lang, 'people').replace('{n}', String(team.size))
                  ]
              ]
            : []),
        [t(lang, 'stack'), project.tags.map((tag) => `<span class="project-tag">${tag}</span>`).join('')]
    ] as [string, string][];
    return rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

/** My part and the result, when the data has them: the answers to "who did what, and did it work?". */
function story(project: ProjectEntry, lang: Lang): string {
    const rows: [string, string | undefined][] = [
        [t(lang, 'role'), project.team?.role[lang]],
        [t(lang, 'result'), project.result?.[lang]]
    ];
    return rows
        .filter(([, v]) => v)
        .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
        .join('');
}

/** The skills two projects share, in the neighbour's own spelling. */
function sharedTags(project: ProjectEntry, other: ProjectEntry): string[] {
    const mine = skillSet(project);
    return other.tags.filter((tag) =>
        tag
            .toLowerCase()
            .split('/')
            .some((part) => mine.has(part.trim()))
    );
}

/** The three projects the map links this one to, with how much they overlap and why. */
function related(project: ProjectEntry, lang: Lang): string {
    return neighbours(project, PROJECTS)
        .map(({ q, s }) => {
            const shared = sharedTags(project, q);
            const why = shared.length
                ? `${t(lang, 'shares')} ${shared.join(', ')}`
                : t(lang, 'sameDomain').replace('{domain}', domainName(lang, q.category));
            const overlap = Math.round(s * 100);
            return `<a class="related-card surface reveal" href="${localizedPath(projectPath(q.id), lang)}">
<span class="related-media"><img ${stillAttrs(q, '(width <= 800px) 92vw, 340px', true)} alt="" loading="lazy" width="640" height="400" /></span>
<span class="related-body"><span class="related-domain">${domainIcon(q.category)}${domainName(lang, q.category)}</span>
<strong>${q.title}</strong><span class="related-why">${why}</span>
<span class="overlap"><span class="overlap-bar"><span class="overlap-fill" data-overlap="${overlap}"></span></span><span class="mono">${t(lang, 'overlap').replace('{n}', String(overlap))}</span></span></span></a>`;
        })
        .join('');
}

export function fillProjectPage(document: Document, project: ProjectEntry, lang: Lang): void {
    const $ = (id: string) => document.getElementById(id)!;

    document.body.dataset.projectId = project.id;
    $('project-title').textContent = project.title;
    $('project-desc').innerHTML = project.description[lang];
    $('project-eyebrow').innerHTML = `${domainName(lang, project.category)} · ${monthName(yearOf(project.date), lang)}`;
    $('project-specs').innerHTML = specs(project, lang);
    const told = story(project, lang);
    if (told) $('project-story').innerHTML = told;
    else $('project-story').remove();
    $('project-media').innerHTML = mediaHtml(project.media, lang);
    $('project-related').innerHTML = related(project, lang);
    $('project-back').setAttribute('href', `${localizedPath('/', lang)}#work`);

    const github = $('project-github');
    if (project.github) github.setAttribute('href', project.github);
    else github.remove();
}
