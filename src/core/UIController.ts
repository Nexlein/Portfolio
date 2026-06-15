/**
 * src/core/UIController.ts
 *
 * Manages:
 *  - Pill-based simulation switching
 *  - Project category filtering
 *  - Scroll-driven nav active state
 *  - Top nav scroll shadow
 *
 * No simulation identifiers are hardcoded here.
 * Behaviour (autoStart) comes from SimConfig via the simulations map.
 */

import { SimConfig } from '../data/simulations.js';
import { SimBase } from './SimBase.js';

export interface ManagedSim {
    instance: SimBase;
    config: SimConfig;
}

export class UIController {
    private readonly sims: Map<string, ManagedSim>;
    private activeSim: string;
    private simPanel: HTMLElement | null;

    constructor(sims: Map<string, ManagedSim>) {
        this.sims     = sims;
        this.simPanel = document.getElementById('sim-panel');
        
        const params = new URLSearchParams(window.location.search);
        this.activeSim = params.get('sim') || (sims.keys().next().value ?? '');

        this.bindPills();
        this.bindProjectFilter();
        this.initScrollObserver();
        this.initNavShadow();

        // Activate the first simulation
        this.switchSim(this.activeSim);
    }

    // ── Pill switcher ──────────────────────────────────

    private bindPills(): void {
        document.querySelectorAll<HTMLElement>('.pill[data-sim]').forEach(pill => {
            pill.addEventListener('click', () => {
                const id = pill.getAttribute('data-sim');
                if (id) this.switchSim(id);
            });
        });
    }

    switchSim(id: string): void {
        const entry = this.sims.get(id);
        if (!entry) return;

        // Pills
        document.querySelectorAll<HTMLElement>('.pill[data-sim]').forEach(p => {
            const active = p.getAttribute('data-sim') === id;
            p.classList.toggle('active', active);
            p.setAttribute('aria-selected', String(active));
        });

        // Sim views
        document.querySelectorAll<HTMLElement>('.sim-view').forEach(v => {
            v.classList.toggle('active', v.id === `sim-${id}`);
        });

        // CSS colour scoping
        if (this.simPanel) this.simPanel.dataset.sim = id;

        // Accent CSS variables
        const { color, glow } = entry.config;
        document.documentElement.style.setProperty('--accent-bar',  color);
        document.documentElement.style.setProperty('--accent-glow', glow);

        // Start / stop simulations
        const prev = this.activeSim;
        this.activeSim = id;

        this.sims.forEach(({ instance, config }, name) => {
            if (name === id) {
                if (config.autoStart) {
                    instance.start();
                } else {
                    instance.clearCanvas();
                    instance.draw();
                }
            } else if (name === prev) {
                instance.stop();
            }
        });
    }

    // ── Project filter ─────────────────────────────────

    private currentYearFilter: string = 'all';
    private currentCatFilter: string = 'all';

    private bindProjectFilter(): void {
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('filter-btn')) return;

            if (target.classList.contains('year-filter')) {
                const filter = target.getAttribute('data-year');
                if (!filter) return;
                this.currentYearFilter = filter;
                document.querySelectorAll('.year-filter').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
            } else if (target.classList.contains('cat-filter')) {
                const filter = target.getAttribute('data-filter');
                if (!filter) return;
                this.currentCatFilter = filter;
                document.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
            }

            document.querySelectorAll<HTMLElement>('.project-card').forEach(card => {
                const catMatch = this.currentCatFilter === 'all' || card.dataset.category === this.currentCatFilter;
                const yearMatch = this.currentYearFilter === 'all' || card.dataset.year === this.currentYearFilter;
                card.style.display = (catMatch && yearMatch) ? 'flex' : 'none';
            });

            // Dynamically hide category buttons that have no projects in the selected year
            const availableCats = new Set<string>();
            document.querySelectorAll<HTMLElement>('.project-card').forEach(card => {
                if (this.currentYearFilter === 'all' || card.dataset.year === this.currentYearFilter) {
                    if (card.dataset.category) availableCats.add(card.dataset.category);
                }
            });

            document.querySelectorAll<HTMLElement>('.cat-filter').forEach(btn => {
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
                document.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.cat-filter[data-filter="all"]');
                if (allBtn) allBtn.classList.add('active');

                // Re-evaluate display since category was reset
                document.querySelectorAll<HTMLElement>('.project-card').forEach(card => {
                    const yearMatch = this.currentYearFilter === 'all' || card.dataset.year === this.currentYearFilter;
                    card.style.display = yearMatch ? 'flex' : 'none';
                });
            }
        });
    }

    // ── Scroll observers ───────────────────────────────

    private initScrollObserver(): void {
        const navLinks = document.querySelectorAll<HTMLElement>('.nav-link[data-section]');
        const sections = document.querySelectorAll<HTMLElement>('section[id]');

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const id = entry.target.id;
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.dataset.section === id);
                    });
                });
            },
            { rootMargin: '-50% 0px -49% 0px' }
        );

        sections.forEach(s => observer.observe(s));
    }

    private initNavShadow(): void {
        const nav = document.getElementById('topnav');
        if (!nav) return;
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
    }
}
