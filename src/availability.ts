import { injectNavbar } from './core/Components.js';
import { translateDOM } from './core/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    injectNavbar('availability');
    // Ensure the CV is translated into the current language
    translateDOM();
});
