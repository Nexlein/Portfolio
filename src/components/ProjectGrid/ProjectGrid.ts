import type { ProjectEntry } from '@/data/projects';
import { renderProjectCards } from './cards';
import { filterProjects } from './filter';

const PAGE_SIZE = 6;

/**
 * Project grid on the home page: wires the year/category filter buttons and
 * "show more", renders the matching cards, and reports card clicks.
 */
export class ProjectGrid {
    private readonly projects: ProjectEntry[];
    private readonly onSelect: (project: ProjectEntry) => void;
    private year = 'all';
    private category = 'all';
    private limit = PAGE_SIZE;

    constructor(projects: ProjectEntry[], onSelect: (project: ProjectEntry) => void) {
        this.projects = projects;
        this.onSelect = onSelect;
        this.bindEvents();
    }

    render(): void {
        const result = filterProjects(this.projects, { year: this.year, category: this.category, limit: this.limit });

        if (result.category !== this.category) {
            this.category = result.category;
            setActive('.cat-filter', document.querySelector('.cat-filter[data-filter="all"]'));
        }

        document.querySelectorAll<HTMLElement>('.cat-filter').forEach((btn) => {
            const cat = btn.dataset.filter;
            if (!cat) return;
            btn.style.display = cat === 'all' || result.categories.has(cat) ? 'inline-block' : 'none';
        });

        const showMore = document.getElementById('show-more-container');
        if (showMore) showMore.style.display = result.hasMore ? 'flex' : 'none';

        renderProjectCards(result.visible);
    }

    private bindEvents(): void {
        document.querySelector('.filter-controls')?.addEventListener('click', (e) => {
            const btn = e.target as HTMLElement;
            if (!btn.classList.contains('filter-btn')) return;

            if (btn.classList.contains('year-filter') && btn.dataset.year) {
                this.year = btn.dataset.year;
                setActive('.year-filter', btn);
            } else if (btn.classList.contains('cat-filter') && btn.dataset.filter) {
                this.category = btn.dataset.filter;
                setActive('.cat-filter', btn);
            } else {
                return;
            }

            this.limit = PAGE_SIZE;
            this.render();
        });

        document.getElementById('show-more-projects')?.addEventListener('click', () => {
            this.limit += PAGE_SIZE;
            this.render();
        });

        document.getElementById('projects-grid')?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.project-link')) return; // GitHub link opens on its own

            const id = target.closest<HTMLElement>('.project-card')?.dataset.projectId;
            const project = this.projects.find((p) => p.id === id);
            if (project) this.onSelect(project);
        });
    }
}

function setActive(groupSelector: string, active: Element | null): void {
    document.querySelectorAll(groupSelector).forEach((el) => el.classList.remove('active'));
    active?.classList.add('active');
}
