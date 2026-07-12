import { i18n, translateDOM } from './core/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initial translation pass
    translateDOM();

    // Listen to i18n changes
    i18n.subscribe(() => {
        translateDOM();
    });

    const printBtn = document.getElementById('cv-print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
