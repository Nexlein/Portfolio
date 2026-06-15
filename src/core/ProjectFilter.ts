export class ProjectFilter {
    private currentYearFilter: string = 'all';
    private currentCatFilter: string = 'all';

    constructor() {
        this.bindProjectFilter();
    }

    private bindProjectFilter(): void {
        const container = document.querySelector('.filter-controls');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('filter-btn')) return;

            if (target.classList.contains('year-filter')) {
                const filter = target.getAttribute('data-year');
                if (!filter) return;
                this.currentYearFilter = filter;
                document.querySelectorAll('.year-filter').forEach((b) => b.classList.remove('active'));
                target.classList.add('active');
            } else if (target.classList.contains('cat-filter')) {
                const filter = target.getAttribute('data-filter');
                if (!filter) return;
                this.currentCatFilter = filter;
                document.querySelectorAll('.cat-filter').forEach((b) => b.classList.remove('active'));
                target.classList.add('active');
            }

            document.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
                const catMatch = this.currentCatFilter === 'all' || card.dataset.category === this.currentCatFilter;
                const yearMatch = this.currentYearFilter === 'all' || card.dataset.year === this.currentYearFilter;
                card.style.display = catMatch && yearMatch ? 'flex' : 'none';
            });

            // Dynamically hide category buttons that have no projects in the selected year
            const availableCats = new Set<string>();
            document.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
                if (this.currentYearFilter === 'all' || card.dataset.year === this.currentYearFilter) {
                    if (card.dataset.category) availableCats.add(card.dataset.category);
                }
            });

            document.querySelectorAll<HTMLElement>('.cat-filter').forEach((btn) => {
                const cat = btn.getAttribute('data-filter');
                if (!cat) return;
                if (cat === 'all') {
                    btn.style.display = 'inline-block';
                } else {
                    btn.style.display = availableCats.has(cat) ? 'inline-block' : 'none';
                }
            });

            // If the active category is now hidden, reset to 'all'
            if (this.currentCatFilter !== 'all' && !availableCats.has(this.currentCatFilter)) {
                this.currentCatFilter = 'all';
                document.querySelectorAll('.cat-filter').forEach((b) => b.classList.remove('active'));
                const allBtn = document.querySelector('.cat-filter[data-filter="all"]');
                if (allBtn) allBtn.classList.add('active');

                // Re-evaluate display since category was reset
                document.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
                    const yearMatch = this.currentYearFilter === 'all' || card.dataset.year === this.currentYearFilter;
                    card.style.display = yearMatch ? 'flex' : 'none';
                });
            }
        });
    }
}
