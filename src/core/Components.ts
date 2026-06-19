import { Icons } from '../utils/Icons.js';
import { i18n } from './i18n.js';

export function injectNavbar(activeSection: 'home' | 'ailab' | 'availability') {
    const isHome = activeSection === 'home';
    const base = isHome ? '' : 'index.html';
    const html = `
    <div class="topnav-inner">
      <a href="${base}#home" class="topnav-brand" aria-label="Back to top">
        <img class="brand-icon" src="/favicon.jpg" alt="Nexlein Logo" style="border-radius: 8px;" />
        <span class="brand-name">Nexlein</span>
      </a>

      <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <nav class="topnav-links" id="topnav-links" aria-label="Main navigation">
        <a href="${base}#home"     class="nav-link ${activeSection === 'home' ? 'active' : ''}" data-section="home" data-i18n="navbar.home">Home</a>
        <a href="${base}#parcours" class="nav-link" data-section="parcours" data-i18n="navbar.journey">Journey</a>
        <a href="${base}#projects" class="nav-link" data-section="projects" data-i18n="navbar.projects">Projects</a>
        <a href="${activeSection === 'availability' ? '#' : 'availability.html'}" class="nav-link ${activeSection === 'availability' ? 'active' : ''}" data-section="availability" data-i18n="navbar.availability">Availability</a>
        <a href="${activeSection === 'ailab' ? '#' : 'ailab.html'}" class="nav-link ${activeSection === 'ailab' ? 'active' : ''}" data-section="ailab" data-i18n="navbar.ailab">AI Lab</a>
        
        <button id="nav-lang-btn" class="nav-lang-toggle" aria-label="Toggle language">
            <span class="lang-en">EN</span> / <span class="lang-fr">FR</span>
        </button>

        <div class="nav-cta-wrapper" style="position: relative; display: inline-block; margin-left: 8px;">
            <button id="nav-contact-btn" class="nav-cta" aria-haspopup="true" aria-expanded="false" style="margin-left: 0; border: none; outline: none; cursor: pointer; font-family: inherit;" data-i18n="navbar.contact">Contact</button>
            <div id="nav-contact-popup" class="contact-popup">
                <a href="mailto:nielsen.combe-bracciale@epitech.eu" class="popup-link">
                    ${Icons.Email}
                    <span data-i18n="navbar.email">Email Me</span>
                </a>
                <a href="https://www.linkedin.com/in/nielsen-combebracciale/" target="_blank" rel="noopener" class="popup-link">
                    ${Icons.LinkedIn}
                    <span data-i18n="navbar.linkedin">LinkedIn</span>
                </a>
            </div>
        </div>
      </nav>
    </div>
    `;
    const header = document.createElement('header');
    header.className = 'topnav';
    header.id = 'topnav';
    header.innerHTML = html;
    document.body.prepend(header);

    // Initial Lang Setup
    const updateLangBtn = () => {
        const langEn = document.querySelector('.lang-en') as HTMLElement;
        const langFr = document.querySelector('.lang-fr') as HTMLElement;
        if (langEn && langFr) {
            const current = i18n.getLang();
            langEn.style.color = current === 'en' ? 'var(--text-primary)' : 'var(--text-muted)';
            langFr.style.color = current === 'fr' ? 'var(--text-primary)' : 'var(--text-muted)';
        }
    };
    updateLangBtn();

    const langBtn = document.getElementById('nav-lang-btn');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const next = i18n.getLang() === 'en' ? 'fr' : 'en';
            i18n.setLang(next);
            updateLangBtn();
        });
    }

    // Attach popup toggle logic
    const btn = document.getElementById('nav-contact-btn');
    const popup = document.getElementById('nav-contact-popup');
    if (btn && popup) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.classList.toggle('show');
            btn.setAttribute('aria-expanded', String(popup.classList.contains('show')));
        });
        document.addEventListener('click', (e) => {
            if (!popup.contains(e.target as Node) && !btn.contains(e.target as Node)) {
                popup.classList.remove('show');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Mobile Menu logic
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const topnavLinks = document.getElementById('topnav-links');
    if (mobileBtn && topnavLinks) {
        mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            topnavLinks.classList.toggle('open');
        });

        // Close menu when clicking a link
        topnavLinks.querySelectorAll('.nav-link').forEach((a) => {
            a.addEventListener('click', () => topnavLinks.classList.remove('open'));
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!topnavLinks.contains(e.target as Node) && !mobileBtn.contains(e.target as Node)) {
                topnavLinks.classList.remove('open');
            }
        });
    }
}

export function injectModal() {
    const html = `
    <button class="modal-close" id="modal-close" aria-label="Close project">
      ${Icons.Close}
    </button>
    <div class="modal-inner">
      <div class="modal-media" id="modal-media"></div>
      <div class="modal-info">
        <div class="modal-tags" id="modal-tags"></div>
        <h2 class="modal-title" id="modal-title"></h2>
        <p class="modal-desc" id="modal-desc"></p>
        <a class="modal-github" id="modal-github" target="_blank" rel="noopener">
          ${Icons.GitHub}
          View on GitHub
        </a>
      </div>
    </div>
    `;
    const dialog = document.createElement('dialog');
    dialog.id = 'project-modal';
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'modal-title');
    dialog.innerHTML = html;
    document.body.appendChild(dialog);
}
