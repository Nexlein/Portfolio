/**
 * src/main.ts — Application entry point.
 *
 * To add a new simulation:
 *   1. Add a SimConfig entry in src/data/simulations.ts
 *   2. Import the class here and add it to SIM_CLASSES
 *   3. Create src/views/<id>.html
 *
 * To add a new project:
 *   1. Add a ProjectEntry in src/data/projects.ts  ← that's it.
 */

import { SIMULATIONS } from './data/simulations.js';
import { PROJECTS } from './data/projects.js';
import { MLSimulation } from './simulations/MLSimulation.js';
import { MLUnsupervisedSimulation } from './simulations/MLUnsupervisedSimulation.js';
import { RLSimulation } from './simulations/RLSimulation.js';
import { FSMSimulation } from './simulations/FSMSimulation.js';
import { GASimulation } from './simulations/GASimulation.js';
import { UAISimulation } from './simulations/UAISimulation.js';
import { ManagedSim } from './core/SimSwitcher.js';
import { SimSwitcher } from './core/SimSwitcher.js';
import { ProjectFilter } from './core/ProjectFilter.js';
import { ScrollObserver } from './core/ScrollObserver.js';
import { NavShadow } from './core/NavShadow.js';
import { renderProjects } from './core/ProjectRenderer.js';
import { renderSimPills, renderSimViews } from './core/SimRenderer.js';
import { injectSimulationThemeVars } from './core/ThemeInjector.js';
import { ProjectModal } from './core/ProjectModal.js';
import { SimBase } from './core/SimBase.js';
import { injectNavbar, injectModal } from './core/Components.js';

// ── Map simulation id → constructor ───────────────────────────────────────────
// Add a new entry here when you add a simulation class.
const SIM_CLASSES: Record<string, new () => SimBase> = {
    ml: MLSimulation,
    'ml-unsupervised': MLUnsupervisedSimulation,
    rl: RLSimulation,
    fsm: FSMSimulation,
    ga: GASimulation,
    uai: UAISimulation
};

// ── Boot ───────────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
    const isAiLab = document.getElementById('sim-panel') !== null;
    injectNavbar(isAiLab ? 'ailab' : 'home');
    injectModal();

    // 0. Inject per-sim CSS vars from data (single source of truth)
    injectSimulationThemeVars(SIMULATIONS);

    // 1. Render dynamic DOM sections from data
    renderProjects(PROJECTS);
    new ProjectModal(PROJECTS); // attach modal to rendered cards

    if (isAiLab) {
        renderSimPills(SIMULATIONS);
        renderSimViews(SIMULATIONS);
        // 2. Fetch and inject simulation view HTML in parallel
        await Promise.all(
            SIMULATIONS.map(async (sim) => {
                const res = await fetch(`views/${sim.id}.html`);
                if (!res.ok) {
                    console.warn(`[main] Could not load view for sim "${sim.id}"`);
                    return;
                }
                const html = await res.text();
                const el = document.getElementById(`sim-${sim.id}`);
                if (el) {
                    el.innerHTML = html;
                    if (sim.relatedProject) {
                        const githubSection = el.querySelector('.github-section');
                        if (githubSection) {
                            const btn = document.createElement('button');
                            btn.className = 'btn-hero-ghost';
                            btn.style.marginTop = '1rem';
                            btn.style.width = '100%';
                            btn.style.textAlign = 'center';
                            btn.style.justifyContent = 'center';
                            btn.innerHTML = 'Related Project Details';
                            btn.onclick = () => {
                                window.location.href = `index.html?project=${sim.relatedProject}#projects`;
                            };
                            githubSection.appendChild(btn);
                        }
                    }
                }
            })
        );
    }

    // 3. Instantiate simulations and pair with their config
    const simsMap = new Map<string, ManagedSim>();
    if (isAiLab) {
        for (const config of SIMULATIONS) {
            const Ctor = SIM_CLASSES[config.id];
            if (!Ctor) {
                console.warn(`[main] No class registered for sim "${config.id}"`);
                continue;
            }
            simsMap.set(config.id, { instance: new Ctor(), config });
        }
    }

    // 4. Hand off to the UI controllers
    let simSwitcher;
    if (isAiLab) {
        simSwitcher = new SimSwitcher(simsMap);
    }
    const projectFilter = new ProjectFilter();
    const scrollObserver = new ScrollObserver();
    const navShadow = new NavShadow();

    // 5. Handle ?project= auto-open
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
        requestAnimationFrame(() => {
            const card = document.querySelector(`.project-card[data-project-id="${projectId}"]`) as HTMLElement;
            if (card) {
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                card.click();
            }
        });
    }

    // Expose for console debugging
    window.__portfolio = { simsMap, simSwitcher, projectFilter, scrollObserver, navShadow };
}

declare global {
    interface Window {
        __portfolio: {
            simsMap: Map<string, ManagedSim>;
            simSwitcher?: SimSwitcher;
            projectFilter: ProjectFilter;
            scrollObserver: ScrollObserver;
            navShadow: NavShadow;
        };
    }
}

window.addEventListener('DOMContentLoaded', bootstrap);
