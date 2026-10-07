import { ProjectEntry } from '../data/projects.js';
import { renderProjectGrid } from '../components/ProjectView/ProjectView.js';

export class ProjectManager {
    private projects: ProjectEntry[];
    private yearFilter: string = 'all';
    private catFilter: string = 'all';
    private maxVisible: number = 6;
    private readonly defaultLimit: number = 6;

    constructor(projects: ProjectEntry[]) {
        this.projects = projects;
        this.bindEvents();
        this.render();
    }

    private bindEvents(): void {
        const container = document.querySelector('.filter-controls');
        if (container) {
            container.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (!target.classList.contains('filter-btn')) return;

                if (target.classList.contains('year-filter')) {
                    const filter = target.getAttribute('data-year');
                    if (!filter) return;
                    this.yearFilter = filter;
                    document.querySelectorAll('.year-filter').forEach((b) => b.classList.remove('active'));
                    target.classList.add('active');
                } else if (target.classList.contains('cat-filter')) {
                    const filter = target.getAttribute('data-filter');
                    if (!filter) return;
                    this.catFilter = filter;
                    document.querySelectorAll('.cat-filter').forEach((b) => b.classList.remove('active'));
                    target.classList.add('active');
                }

                this.maxVisible = this.defaultLimit; // Reset limit when filter changes
                this.render();
            });
        }

        const showMoreBtn = document.getElementById('show-more-projects');
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', () => {
                this.maxVisible += 6;
                this.render();
            });
        }

        const grid = document.getElementById('projects-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (target.closest('.project-link')) return; // Ignore github link clicks

                const card = target.closest('.project-card') as HTMLElement;
                if (card) {
                    const id = card.getAttribute('data-project-id');
                    if (id) {
                        window.dispatchEvent(new CustomEvent('openProjectModal', { detail: { id } }));
                    }
                }
            });
        }
    }

    public render(): void {
        // 1. Filter by year
        const yearMatched = this.projects.filter((p) => {
            const pYear = p.year ?? 'Tek2';
            return this.yearFilter === 'all' || pYear === this.yearFilter;
        });

        // 2. Determine available categories
        const availableCats = new Set<string>();
        yearMatched.forEach((p) => availableCats.add(p.category));

        // 3. Reset category if no longer available
        if (this.catFilter !== 'all' && !availableCats.has(this.catFilter)) {
            this.catFilter = 'all';
            document.querySelectorAll('.cat-filter').forEach((b) => b.classList.remove('active'));
            const allBtn = document.querySelector('.cat-filter[data-filter="all"]');
            if (allBtn) allBtn.classList.add('active');
        }

        // 4. Update UI for category buttons
        document.querySelectorAll<HTMLElement>('.cat-filter').forEach((btn) => {
            const cat = btn.getAttribute('data-filter');
            if (!cat) return;
            btn.style.display = cat === 'all' || availableCats.has(cat) ? 'inline-block' : 'none';
        });

        // 5. Final filter by category
        const fullyMatched = yearMatched.filter((p) => this.catFilter === 'all' || p.category === this.catFilter);

        // 6. Slice to max visible
        const visibleProjects = fullyMatched.slice(0, this.maxVisible);

        // 7. Update Show More button
        const showMoreContainer = document.getElementById('show-more-container');
        if (showMoreContainer) {
            showMoreContainer.style.display = fullyMatched.length > this.maxVisible ? 'flex' : 'none';
        }

        // 8. Render to DOM
        renderProjectGrid(visibleProjects);
    }
}
