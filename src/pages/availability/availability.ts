import { injectNavbar } from '@/components/Navbar/Navbar';
import { translateDOM } from '@/core/i18n';

document.addEventListener('DOMContentLoaded', () => {
    injectNavbar('availability');
    // Ensure the CV is translated into the current language
    translateDOM();
});
