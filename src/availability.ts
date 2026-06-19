import { injectNavbar } from './core/Components.js';
import { injectSimulationThemeVars } from './core/ThemeInjector.js';
import { SIMULATIONS } from './data/simulations.js';
import { i18n } from './core/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    injectSimulationThemeVars(SIMULATIONS);
    injectNavbar('availability');
    i18n.translateDOM();
});
