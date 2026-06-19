import { injectNavbar } from './core/Components.js';
import { injectSimulationThemeVars } from './core/ThemeInjector.js';
import { SIMULATIONS } from './data/simulations.js';

document.addEventListener('DOMContentLoaded', () => {
    injectSimulationThemeVars(SIMULATIONS);
    injectNavbar('availability');
});
