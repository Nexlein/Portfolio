/** CV page: the content is rendered at build time (src/pages/cv/blocks.ts); this adds the nav and the print button. */
import { initAnalytics } from '@/core/analytics';
import { initNav } from '@/components/Nav/Nav';

initAnalytics();
initNav();
document.getElementById('cv-print-btn')?.addEventListener('click', () => window.print());
