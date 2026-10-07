import { translateDOM } from '@/core/i18n';
import { initAnalytics } from '@/core/analytics';

document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    // Later language changes (here or in the parent page via the storage event) re-translate on their own
    translateDOM();

    const printBtn = document.getElementById('cv-print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
