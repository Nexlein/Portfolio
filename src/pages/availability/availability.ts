import { injectNavbar } from '@/components/Navbar/Navbar';
import { translateDOM } from '@/core/i18n';
import { initAnalytics } from '@/core/analytics';

document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    injectNavbar('availability');
    translateDOM();
});
