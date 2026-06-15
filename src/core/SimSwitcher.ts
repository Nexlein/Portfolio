import { SimConfig } from '../data/simulations.js';
import { SimBase } from './SimBase.js';

export interface ManagedSim {
    instance: SimBase;
    config: SimConfig;
}

export class SimSwitcher {
    private readonly sims: Map<string, ManagedSim>;
    private activeSim: string;
    private simPanel: HTMLElement | null;

    constructor(sims: Map<string, ManagedSim>) {
        this.sims = sims;
        this.simPanel = document.getElementById('sim-panel');

        const params = new URLSearchParams(window.location.search);
        this.activeSim = params.get('sim') || (sims.keys().next().value ?? '');

        this.bindPills();
        this.switchSim(this.activeSim);
    }

    private bindPills(): void {
        document.querySelectorAll<HTMLElement>('.pill[data-sim]').forEach((pill) => {
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
        document.querySelectorAll<HTMLElement>('.pill[data-sim]').forEach((p) => {
            const active = p.getAttribute('data-sim') === id;
            p.classList.toggle('active', active);
            p.setAttribute('aria-selected', String(active));
        });

        // Sim views
        document.querySelectorAll<HTMLElement>('.sim-view').forEach((v) => {
            v.classList.toggle('active', v.id === `sim-${id}`);
        });

        // CSS colour scoping
        if (this.simPanel) this.simPanel.dataset.sim = id;

        // Accent CSS variables
        const { color, glow } = entry.config;
        document.documentElement.style.setProperty('--accent-bar', color);
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
}
