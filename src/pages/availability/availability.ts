import { injectNavbar } from '@/components/Navbar/Navbar';
import { translateDOM } from '@/core/i18n';

document.addEventListener('DOMContentLoaded', () => {
    injectNavbar('availability');
    translateDOM();
});
