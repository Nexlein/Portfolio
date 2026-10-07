/**
 * Project detail modal. Filled from a ProjectEntry, so nothing is scraped from the cards.
 */

import type { ProjectEntry } from '@/data/projects';
import { i18n } from '@/core/i18n';
import { Icons } from '@/ui/icons';
import { buildModalMediaHtml } from './media';
import { bindModalGallery } from './gallery';

export class ProjectModal {
    private readonly backdrop: HTMLElement;
    private readonly mediaEl: HTMLElement;
    private readonly tagsEl: HTMLElement;
    private readonly titleEl: HTMLElement;
    private readonly descEl: HTMLElement;
    private readonly githubEl: HTMLAnchorElement;

    constructor() {
        this.backdrop = document.getElementById('project-modal-backdrop') as HTMLElement;
        this.mediaEl = document.getElementById('modal-media') as HTMLElement;
        this.tagsEl = document.getElementById('modal-tags') as HTMLElement;
        this.titleEl = document.getElementById('modal-title') as HTMLElement;
        this.descEl = document.getElementById('modal-desc') as HTMLElement;
        this.githubEl = document.getElementById('modal-github') as HTMLAnchorElement;

        this.bindClose();
    }

    private bindClose(): void {
        // Close button
        document.getElementById('modal-close')?.addEventListener('click', () => this.close());

        // Click on backdrop (outside dialog window)
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) {
                this.close();
            }
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.backdrop.classList.contains('show')) {
                this.close();
            }
        });
    }

    open(project: ProjectEntry): void {
        this.titleEl.textContent = project.title;
        this.descEl.innerHTML = i18n.t(`projects_desc.${project.id}`);

        this.tagsEl.innerHTML = project.tags.map((t: string) => `<span class="project-tag">${t}</span>`).join('');

        this.mediaEl.innerHTML = buildModalMediaHtml(project.media);

        if (project.media.type === 'gallery') {
            bindModalGallery(this.mediaEl, project.media.images.length);
        }

        if (project.github) {
            this.githubEl.href = project.github;
            this.githubEl.innerHTML = `${Icons.GitHub} ${i18n.t('modal.github')}`;
            this.githubEl.style.display = 'inline-flex';
        } else {
            this.githubEl.style.display = 'none';
        }

        // Force reflow and add .show
        void this.backdrop.offsetWidth;
        this.backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    close(): void {
        // Stop any playing video before closing
        this.mediaEl.querySelector('video')?.pause();
        this.backdrop.classList.remove('show');

        // Wait for CSS transition to finish before actually closing
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 300); // 300ms matches --t-normal
    }
}
