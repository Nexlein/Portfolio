import '../../styles/global.css';
import './availability.css';
import { injectNavbar } from '../../components/Navbar/Navbar.js';
import { translateDOM } from '../../core/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    injectNavbar('availability');
    // Ensure the CV is translated into the current language
    translateDOM();
});
