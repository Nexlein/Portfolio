import { i18n } from './core/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initial translation pass
    i18n.translateDOM();

    // Listen to i18n changes
    i18n.subscribe(() => {
        i18n.translateDOM();
    });

    const printBtn = document.getElementById('cv-print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
