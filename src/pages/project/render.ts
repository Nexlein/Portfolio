/**
 * Fill the project page template (project.html) for one project, at build time.
 * Relative imports only: vite-plugins/pages.ts runs this from Node, without the '@/' alias.
 */
import type { ProjectEntry } from '../../data/projects.ts';
import { buildModalMediaHtml } from '../../components/ProjectModal/media.ts';
import { localizedPath, lookup, type Lang } from '../../core/translate.ts';
import { Icons } from '../../ui/icons.ts';
import { videoPoster, videoType } from '../../ui/video.ts';

const CATEGORY_LABEL: Record<ProjectEntry['category'], string> = {
    ai: 'projects.filterAi',
    architecture: 'projects.filterArch',
    systems: 'projects.filterSys',
    devops: 'projects.filterDevops',
    graphical: 'projects.filterGraph'
};

/** Plain-text description (dictionaries may contain inline HTML) for meta tags and JSON-LD. */
export function projectDescription(project: ProjectEntry, lang: Lang): string {
    return project.description[lang]
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function mediaHtml(project: ProjectEntry): string {
    const { media } = project;
    if (media.type !== 'video') return buildModalMediaHtml(media);
    // Lazy like the cards: playVideosWhenVisible() starts it on screen, unless reduced motion is preferred
    return `<video loop muted playsinline preload="none" poster="${videoPoster(media.src)}"><source src="${media.src}" type="${videoType(media.src)}"></video>`;
}

export function fillProjectPage(document: Document, project: ProjectEntry, lang: Lang): void {
    const $ = (id: string) => document.getElementById(id)!;

    document.body.dataset.projectId = project.id;
    $('project-title').textContent = project.title;
    $('project-desc').innerHTML = project.description[lang];

    const year = project.year ?? 'Tek2';
    const yearLabel = year === 'Personal' ? lookup(lang, 'projects.filterPersonal') : year;
    $('project-eyebrow').textContent = `${lookup(lang, CATEGORY_LABEL[project.category])} · ${yearLabel}`;

    $('project-tags').innerHTML = project.tags.map((tag) => `<span class="project-tag">${tag}</span>`).join('');
    $('project-media').innerHTML = mediaHtml(project);
    $('project-back').setAttribute('href', `${localizedPath('/', lang)}#work`);

    const github = $('project-github');
    if (project.github) {
        github.setAttribute('href', project.github);
        github.innerHTML = `${Icons.GitHub} <span data-i18n="modal.github"></span>`;
    } else {
        github.remove();
    }
}
