import { translateDOM } from '@/core/i18n';

document.addEventListener('DOMContentLoaded', () => {
    // Later language changes (here or in the parent page via the storage event) re-translate on their own
    translateDOM();

    const printBtn = document.getElementById('cv-print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
