import type { ProjectEntry, ProjectMedia } from '@/data/projects';
import { i18n, translateDOM } from '@/core/i18n';
import { Icons } from '@/ui/icons';
import { playVideosWhenVisible, videoPoster, videoType } from '@/ui/video';
import { projectYear } from './filter';

export function renderProjectCards(projects: ProjectEntry[]): void {
    const grid = document.getElementById('projects-grid');
    if (grid) {
        grid.innerHTML = projects.map((p) => renderCard(p)).join('');
        playVideosWhenVisible(grid);
    }
    // Translate injected HTML
    translateDOM();
}

function renderCard(p: ProjectEntry): string {
    return /* html */ `
    <article class="project-card" data-category="${p.category}" data-project-id="${p.id}" data-year="${projectYear(p)}">
        ${renderMedia(p.media)}
        <div class="project-info">
            <div class="project-tags">
                ${p.tags.map((tag: string) => `<span class="project-tag">${tag}</span>`).join('')}
            </div>
            <h3>${p.title}</h3>
            <p>${p.description[i18n.getLang()]}</p>
            ${renderGithubLink(p.github, p.id)}
        </div>
    </article>`;
}

function renderMedia(media: ProjectMedia): string {
    switch (media.type) {
        case 'video':
            return /* html */ `
            <div class="project-media">
                <video loop muted playsinline preload="none" poster="${videoPoster(media.src)}" class="media-fit">
                    <source src="${media.src}" type="${videoType(media.src)}">
                </video>
            </div>`;
        case 'image':
            return /* html */ `
            <div class="project-media">
                <img src="${media.src}" alt="${media.alt}" class="media-fit" loading="lazy">
            </div>`;
        case 'gallery':
            return /* html */ `
            <div class="project-media">
                <img src="${media.images[0].src}" alt="${media.images[0].alt}" class="media-fit" loading="lazy">
                <div class="gallery-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>${media.images.length}</span>
                </div>
            </div>`;
        default:
            return '';
    }
}

function renderGithubLink(github: string, id: string): string {
    if (!github) return '';
    return /* html */ `
    <a href="${github}" target="_blank" rel="noopener" class="project-link" id="project-${id}-link">
        ${Icons.GitHub}
        ${i18n.t('modal.github')}
    </a>`;
}
