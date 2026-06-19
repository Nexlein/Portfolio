/**
 * src/core/ThemeInjector.ts
 *
 * Generates CSS custom properties for each simulation's accent colour
 * directly from the SIMULATIONS data array, eliminating the duplicate
 * colour values that previously lived in theme.css.
 *
 * Called once at boot before anything else renders.
 */

import { SimConfig } from '../data/simulations.js';

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export function injectSimulationThemeVars(simulations: SimConfig[]): void {
    const root = document.documentElement;
    for (const sim of simulations) {
        root.style.setProperty(`--clr-${sim.id}`, sim.color);
        root.style.setProperty(`--clr-${sim.id}-glow`, hexToRgba(sim.color, 0.18));
        root.style.setProperty(`--clr-${sim.id}-soft`, hexToRgba(sim.color, 0.08));
    }
}
