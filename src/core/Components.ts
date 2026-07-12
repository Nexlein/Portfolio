import { Icons } from '../utils/Icons.js';
import { i18n } from './i18n.js';

export class NavbarComponent {
    private readonly activeSection: 'home' | 'availability';

    constructor(activeSection: 'home' | 'availability') {
        this.activeSection = activeSection;
    }

    public inject(): void {
        const header = document.createElement('header');
        header.className = 'topnav';
        header.id = 'topnav';
        header.innerHTML = this.buildHtml();
        document.body.prepend(header);

        this.bindEvents();
    }

    private buildHtml(): string {
        const isHome = this.activeSection === 'home';
        const base = isHome ? '' : 'index.html';
        return `
        <div class="topnav-inner">
          <a href="${base}#home" class="topnav-brand" aria-label="Back to top">
            <img class="brand-icon" src="/favicon.jpg" alt="Nexlein Logo" style="border-radius: 8px;" />
            <span class="brand-name">Nexlein</span>
          </a>

          <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          <nav class="topnav-links" id="topnav-links" aria-label="Main navigation">
            <a href="${base}#home"     class="nav-link ${this.activeSection === 'home' ? 'active' : ''}" data-section="home" data-i18n="navbar.home">Home</a>
            <a href="${base}#parcours" class="nav-link" data-section="parcours" data-i18n="navbar.journey">Journey</a>
            <a href="${base}#projects" class="nav-link" data-section="projects" data-i18n="navbar.projects">Projects</a>
            <a href="${this.activeSection === 'availability' ? '#' : 'availability.html'}" class="nav-link ${this.activeSection === 'availability' ? 'active' : ''}" data-section="availability" data-i18n="navbar.availability">Availability</a>
            
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
    }

    private bindEvents(): void {
        this.bindLanguageToggle();
        this.bindContactPopup();
        this.bindMobileMenu();
    }

    private bindLanguageToggle(): void {
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
    }

    private bindContactPopup(): void {
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
    }

    private bindMobileMenu(): void {
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const topnavLinks = document.getElementById('topnav-links');
        if (mobileBtn && topnavLinks) {
            mobileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                topnavLinks.classList.toggle('open');
            });

            topnavLinks.querySelectorAll('.nav-link').forEach((a) => {
                a.addEventListener('click', () => topnavLinks.classList.remove('open'));
            });

            document.addEventListener('click', (e) => {
                if (!topnavLinks.contains(e.target as Node) && !mobileBtn.contains(e.target as Node)) {
                    topnavLinks.classList.remove('open');
                }
            });
        }
    }
}

export function injectNavbar(activeSection: 'home' | 'availability') {
    new NavbarComponent(activeSection).inject();
}
