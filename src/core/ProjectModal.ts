/**
 * src/core/ProjectModal.ts
 *
 * Opens the project detail modal when a project card is clicked.
 * Reads directly from PROJECTS data — no DOM scraping.
 */

import { ProjectEntry, ProjectMedia } from '../data/projects.js';
import { SIMULATIONS } from '../data/simulations.js';

function buildModalMedia(media: ProjectMedia): string {
    switch (media.type) {
        case 'video':
            return `<video src="${media.src}" autoplay loop muted playsinline></video>`;
        case 'image':
            return `<img src="${media.src}" alt="${media.alt}">`;
        case 'gallery':
            const imagesHtml = media.images.map((img, i) => `<img src="${img.src}" alt="${img.alt}" class="${i === 0 ? 'active' : ''}" data-idx="${i}">`).join('');
            const dotsHtml = media.images.map((_, i) => `<div class="gallery-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`).join('');
            return `
            <div class="modal-gallery">
                ${imagesHtml}
                <div class="gallery-nav-btn prev">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </div>
                <div class="gallery-nav-btn next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
                <div class="gallery-dots">${dotsHtml}</div>
            </div>`;
        case 'placeholder':
        default: {
            const label = media.type === 'placeholder' ? (media.label ?? 'No preview') : 'No preview';
            return `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:0.8rem;font-family:var(--font-mono)">${label}</div>`;
        }
    }
}

export class ProjectModal {
    private readonly dialog: HTMLDialogElement;
    private readonly mediaEl: HTMLElement;
    private readonly tagsEl: HTMLElement;
    private readonly titleEl: HTMLElement;
    private readonly descEl: HTMLElement;
    private readonly githubEl: HTMLAnchorElement;
    private readonly actionsContainerEl: HTMLElement;

    constructor(projects: ProjectEntry[]) {
        this.dialog   = document.getElementById('project-modal') as HTMLDialogElement;
        this.mediaEl  = document.getElementById('modal-media')  as HTMLElement;
        this.tagsEl   = document.getElementById('modal-tags')   as HTMLElement;
        this.titleEl  = document.getElementById('modal-title')  as HTMLElement;
        this.descEl   = document.getElementById('modal-desc')   as HTMLElement;
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

        this.bindCardClicks(projects);
        this.bindClose();
    }

    private bindCardClicks(projects: ProjectEntry[]): void {
        // Use event delegation on the grid — works even after cards are re-rendered
        document.addEventListener('click', (e) => {
            const card = (e.target as HTMLElement).closest<HTMLElement>('.project-card');
            if (!card) return;

            // Don't open modal when clicking the GitHub link directly
            if ((e.target as HTMLElement).closest('.project-link')) return;

            const id = card.dataset.projectId;
            const project = projects.find(p => p.id === id);
            if (project) this.open(project);
        });
    }

    private bindClose(): void {
        // Close button
        document.getElementById('modal-close')?.addEventListener('click', () => this.close());

        // Click on backdrop (outside dialog box)
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) this.close();
        });

        // Escape key (native <dialog> behaviour, but we also pause video)
        this.dialog.addEventListener('cancel', () => this.close());
    }

    open(project: ProjectEntry): void {
        this.mediaEl.innerHTML  = buildModalMedia(project.media);
        this.tagsEl.innerHTML   = project.tags.map(t => `<span class="project-tag">${t}</span>`).join('');
        this.titleEl.textContent = project.title as string;
        this.descEl.innerHTML    = project.description as string;

        if (project.media.type === 'gallery') {
            this.bindGalleryEvents(project.media.images.length);
        }

        if (project.github) {
            this.githubEl.href = project.github;
            this.githubEl.style.display = '';
        } else {
            this.githubEl.style.display = 'none';
        }

        // Render "Try Simulation" buttons
        this.actionsContainerEl.innerHTML = '';
        if (project.relatedSims && project.relatedSims.length > 0) {
            project.relatedSims.forEach(simId => {
                const simConfig = SIMULATIONS.find(s => s.id === simId);
                if (!simConfig) return;
                const btn = document.createElement('button');
                btn.className = 'modal-github'; // Match GitHub button styling
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Try ${simConfig.label}
                `;
                btn.onclick = () => {
                    this.close();
                    const pill = document.querySelector(`.pill[data-sim="${simId}"]`) as HTMLElement;
                    if (pill) {
                        pill.click();
                        document.getElementById('ailab')?.scrollIntoView({ behavior: 'smooth' });
                    }
                };
                this.actionsContainerEl.appendChild(btn);
            });
        }

        this.dialog.showModal();
        document.body.style.overflow = 'hidden';
    }

    close(): void {
        // Stop any playing video before closing
        this.mediaEl.querySelector('video')?.pause();
        this.dialog.close();
        document.body.style.overflow = '';
    }

    private bindGalleryEvents(total: number): void {
        const gallery = this.mediaEl.querySelector('.modal-gallery');
        if (!gallery) return;

        let currentIdx = 0;
        const images = gallery.querySelectorAll('img');
        const dots = gallery.querySelectorAll('.gallery-dot');
        const prevBtn = gallery.querySelector('.prev');
        const nextBtn = gallery.querySelector('.next');

        const updateGallery = (newIdx: number) => {
            images[currentIdx].classList.remove('active');
            dots[currentIdx].classList.remove('active');
            currentIdx = (newIdx + total) % total;
            images[currentIdx].classList.add('active');
            dots[currentIdx].classList.add('active');
        };

        prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); updateGallery(currentIdx - 1); });
        nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); updateGallery(currentIdx + 1); });
        
        dots.forEach((dot, i) => {
            dot.addEventListener('click', (e) => { e.stopPropagation(); updateGallery(i); });
        });
    }
}
