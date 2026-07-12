/**
 * src/core/ProjectModal.ts
 *
 * Opens the project detail modal when a project card is clicked.
 * Reads directly from PROJECTS data — no DOM scraping.
 */

import { ProjectEntry } from '../data/projects.js';

import { ModalMediaRenderer } from './ModalMediaRenderer.js';
import { ModalGallery } from './ModalGallery.js';
import { i18n } from './i18n.js';

export class ProjectModal {
    private readonly backdrop: HTMLElement;
    private readonly mediaEl: HTMLElement;
    private readonly tagsEl: HTMLElement;
    private readonly titleEl: HTMLElement;
    private readonly descEl: HTMLElement;
    private readonly githubEl: HTMLAnchorElement;
    private readonly actionsContainerEl: HTMLElement;

    constructor(projects: ProjectEntry[]) {
        this.backdrop = document.getElementById('project-modal-backdrop') as HTMLElement;
        this.mediaEl = document.getElementById('modal-media') as HTMLElement;
        this.tagsEl = document.getElementById('modal-tags') as HTMLElement;
        this.titleEl = document.getElementById('modal-title') as HTMLElement;
        this.descEl = document.getElementById('modal-desc') as HTMLElement;
        this.githubEl = document.getElementById('modal-github') as HTMLAnchorElement;

        // Wrap github button and extra actions in a flex row
        let actionRow = document.getElementById('modal-action-row');
        if (!actionRow) {
            actionRow = document.createElement('div');
            actionRow.id = 'modal-action-row';
            actionRow.style.display = 'flex';
            actionRow.style.gap = '8px';
            actionRow.style.flexWrap = 'wrap';
            actionRow.style.marginTop = 'auto';

            this.githubEl.style.marginTop = '0'; // Let the row handle auto margin
            this.githubEl.parentElement?.insertBefore(actionRow, this.githubEl);
            actionRow.appendChild(this.githubEl);

            const extraActions = document.createElement('div');
            extraActions.id = 'modal-extra-actions';
            extraActions.style.display = 'flex';
            extraActions.style.gap = '8px';
            actionRow.appendChild(extraActions);

            this.actionsContainerEl = extraActions;
        } else {
            this.actionsContainerEl = document.getElementById('modal-extra-actions') as HTMLElement;
        }

        // Listen for custom event from ProjectManager
        window.addEventListener('openProjectModal', ((e: CustomEvent<{ id: string }>) => {
            const project = projects.find((p) => p.id === e.detail.id);
            if (project) this.open(project);
        }) as EventListener);

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
        this.titleEl.textContent = project.title as string;
        this.descEl.innerHTML = i18n.t(`projects_desc.${project.id}`);

        this.tagsEl.innerHTML = project.tags.map((t) => `<span class="project-tag">${t}</span>`).join('');

        this.mediaEl.innerHTML = ModalMediaRenderer.buildHtml(project.media);

        if (project.media.type === 'gallery') {
            ModalGallery.bind(this.mediaEl, project.media.images.length);
        }

        if (project.github) {
            this.githubEl.href = project.github;
            this.githubEl.innerHTML = `
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                ${i18n.t('modal.github')}
            `;
            this.githubEl.style.display = 'inline-flex';
        } else {
            this.githubEl.style.display = 'none';
        }

        // Clean out actions container
        this.actionsContainerEl.innerHTML = '';

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
