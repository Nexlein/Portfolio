/**
 * src/core/SimRenderer.ts
 *
 * Builds the pill switcher buttons and sim-view containers in the DOM
 * from the SIMULATIONS config array — so index.html stays static and clean.
 */

import { SimConfig } from '../data/simulations.js';

export function renderSimPills(simulations: SimConfig[]): void {
    const container = document.getElementById('sim-pills');
    if (!container) return;

    container.innerHTML = simulations.map((sim, i) => /* html */ `
    <button
        class="pill${i === 0 ? ' active' : ''}"
        data-sim="${sim.id}"
        id="pill-${sim.id}"
        role="tab"
        aria-selected="${i === 0}"
        aria-controls="sim-${sim.id}"
    >
        <span class="pill-dot" style="background:${sim.color}"></span>
        <span class="pill-label">${sim.label}</span>
    </button>`).join('');
}

export function renderSimViews(simulations: SimConfig[]): void {
    const panel = document.getElementById('sim-panel');
    if (!panel) return;

    panel.innerHTML = simulations.map((sim, i) => /* html */ `
    <div
        id="sim-${sim.id}"
        class="sim-view${i === 0 ? ' active' : ''}"
        role="tabpanel"
        aria-labelledby="pill-${sim.id}"
    ></div>`).join('');

    // Stamp the initial data-sim on the panel for CSS colour scoping
    panel.dataset.sim = simulations[0]?.id ?? '';
}
