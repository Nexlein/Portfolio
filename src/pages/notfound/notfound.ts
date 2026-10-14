/** 404 page: static content rendered at build time (see NOT_FOUND in vite-plugins/pages.ts); this only wakes the nav. */
import { initAnalytics } from '@/core/analytics';
import { initNav } from '@/components/Nav/Nav';

initAnalytics();
initNav();
