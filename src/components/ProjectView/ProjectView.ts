import { ProjectEntry, ProjectMedia } from '../../data/projects.js';
import { i18n, translateDOM } from '../../core/i18n.js';

export class ProjectView {
    static renderGrid(projects: ProjectEntry[]): void {
        const grid = document.getElementById('projects-grid');
        if (grid) {
            grid.innerHTML = projects.map((p) => this.renderCard(p)).join('');
        }
        // Translate injected HTML
        translateDOM();
    }

    private static renderCard(p: ProjectEntry): string {
        return /* html */ `
        <article class="project-card" data-category="${p.category}" data-project-id="${p.id}" data-year="${p.year ?? 'Tek2'}">
            ${this.renderMedia(p.media)}
            <div class="project-info">
                <div class="project-tags">
                    ${p.tags.map((tag: string) => `<span class="project-tag">${tag}</span>`).join('')}
                </div>
                <h3>${p.title}</h3>
                <p>${i18n.t(`projects_desc.${p.id}`)}</p>
                ${this.renderGithubLink(p.github, p.id)}
            </div>
        </article>`;
    }

    private static renderMedia(media: ProjectMedia): string {
        switch (media.type) {
            case 'video':
                const ext = media.src.split('.').pop()?.toLowerCase();
                const typeStr = ext === 'webm' ? 'video/webm' : 'video/mp4';
                return /* html */ `
                <div class="project-media">
                    <video autoplay loop muted playsinline preload="metadata" class="media-fit">
                        <source src="${media.src}" type="${typeStr}">
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

    private static renderGithubLink(github: string, id: string): string {
        if (!github) return '';
        const githubIcon = /* html */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>`;
        return /* html */ `
        <a href="${github}" target="_blank" rel="noopener" class="project-link" id="project-${id}-link">
            ${githubIcon}
            ${i18n.t('modal.github')}
        </a>`;
    }
}
