import { i18n } from '@/core/i18n';
import { localizedPath } from '@/core/translate';

type Section = 'home' | 'availability' | 'projects';

class NavbarComponent {
    private readonly activeSection: Section;

    constructor(activeSection: Section) {
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
        // Absolute, language-aware links so the navbar works from any depth (/fr/projects/x.html)
        const lang = i18n.getLang();
        const base = this.activeSection === 'home' ? '' : localizedPath('/', lang);
        const availability = this.activeSection === 'availability' ? '#' : localizedPath('/availability.html', lang);
        const contact = document.getElementById('contact') ? '#contact' : `${localizedPath('/', lang)}#contact`;
        const active = (section: Section) => (this.activeSection === section ? 'active' : '');
        return `
        <div class="topnav-inner">
          <a href="${base}#home" class="topnav-brand" aria-label="Back to top">
            <img class="brand-icon" src="/brand-icon.webp" width="28" height="28" alt="Nexlein Logo" />
            <span class="brand-name">Nexlein</span>
          </a>

          <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          <nav class="topnav-links" id="topnav-links" aria-label="Main navigation">
            <a href="${base}#home"     class="nav-link ${active('home')}" data-section="home" data-i18n="navbar.home">Home</a>
            <a href="${base}#parcours" class="nav-link" data-section="parcours" data-i18n="navbar.journey">Journey</a>
            <a href="${base}#projects" class="nav-link ${active('projects')}" data-section="projects" data-i18n="navbar.projects">Projects</a>
            <a href="${availability}" class="nav-link ${active('availability')}" data-section="availability" data-i18n="navbar.availability">Availability</a>
            
            <button id="nav-lang-btn" class="nav-lang-toggle" aria-label="Toggle language">
                <span class="lang-en">EN</span> / <span class="lang-fr">FR</span>
            </button>

            <a href="${contact}" class="nav-cta" data-i18n="navbar.contact">Contact</a>
          </nav>
        </div>
        `;
    }

    private bindEvents(): void {
        this.bindLanguageToggle();
        this.bindMobileMenu();
    }

    /** The active language is highlighted by CSS (html[lang]); clicking opens the page in the other one. */
    private bindLanguageToggle(): void {
        document.getElementById('nav-lang-btn')?.addEventListener('click', () => {
            i18n.switchTo(i18n.getLang() === 'en' ? 'fr' : 'en');
        });
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

export function injectNavbar(activeSection: Section) {
    new NavbarComponent(activeSection).inject();
}
