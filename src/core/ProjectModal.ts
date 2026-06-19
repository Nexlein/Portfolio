/**
 * src/core/ProjectModal.ts
 *
 * Opens the project detail modal when a project card is clicked.
 * Reads directly from PROJECTS data — no DOM scraping.
 */

import { ProjectEntry } from '../data/projects.js';
import { SIMULATIONS } from '../data/simulations.js';

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

        // Global handler for native onclick attribute (bypass Safari event delegation issues)
        window.openProjectModal = (event: Event, id: string) => {
            const target = event.target as HTMLElement;
            if (target && target.closest('.project-link')) return;
            const project = projects.find((p) => p.id === id);
            if (project) this.open(project);
        };

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
        this.descEl.innerHTML = i18n.t_obj(project.description);

        this.tagsEl.innerHTML = project.tags.map((t) => `<span class="project-tag">${t}</span>`).join('');

        this.mediaEl.innerHTML = ModalMediaRenderer.buildHtml(project.media);

        if (project.media.type === 'gallery') {
            ModalGallery.bind(this.mediaEl, project.media.images.length);
        }

        if (project.github) {
            this.githubEl.href = project.github;
            this.githubEl.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:16px;height:16px;">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                ${i18n.t('modal.github')}
            `;
            this.githubEl.style.display = 'inline-flex';
        } else {
            this.githubEl.style.display = 'none';
        }

        // Render "Try Simulation" buttons
        this.actionsContainerEl.innerHTML = '';
        if (project.relatedSims && project.relatedSims.length > 0) {
            project.relatedSims.forEach((simId) => {
                const simConfig = SIMULATIONS.find((s) => s.id === simId);
                if (!simConfig) return;
                const btn = document.createElement('button');
                btn.className = 'modal-github'; // Match GitHub button styling
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    ${i18n.t('modal.trySim')} ${i18n.t_obj(simConfig.label)}
                `;
                btn.onclick = () => {
                    this.close();
                    window.location.href = `ailab.html?sim=${simId}`;
                };
                this.actionsContainerEl.appendChild(btn);
            });
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
