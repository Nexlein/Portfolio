import { Icons } from '../utils/Icons.js';

export function injectNavbar(activeSection: 'home' | 'ailab' | 'availability') {
    const isHome = activeSection === 'home';
    const base = isHome ? '' : 'index.html';
    const html = `
    <div class="topnav-inner">
      <a href="${base}#home" class="topnav-brand" aria-label="Back to top">
        <img class="brand-icon" src="/favicon.jpg" alt="Nexlein Logo" style="border-radius: 8px;" />
        <span class="brand-name">Nexlein</span>
      </a>

      <nav class="topnav-links" aria-label="Main navigation">
        <a href="${base}#home"     class="nav-link ${activeSection === 'home' ? 'active' : ''}" data-section="home">Home</a>
        <a href="${base}#parcours" class="nav-link" data-section="parcours">Journey</a>
        <a href="${base}#projects" class="nav-link" data-section="projects">Projects</a>
        <a href="${activeSection === 'availability' ? '#' : 'availability.html'}" class="nav-link ${activeSection === 'availability' ? 'active' : ''}" data-section="availability">Availability</a>
        <a href="${activeSection === 'ailab' ? '#' : 'ailab.html'}" class="nav-link ${activeSection === 'ailab' ? 'active' : ''}" data-section="ailab">AI Lab</a>
        <div class="nav-cta-wrapper" style="position: relative; display: inline-block; margin-left: 8px;">
            <button id="nav-contact-btn" class="nav-cta" aria-haspopup="true" aria-expanded="false" style="margin-left: 0; border: none; outline: none; cursor: pointer; font-family: inherit;">Contact</button>
            <div id="nav-contact-popup" class="contact-popup">
                <a href="mailto:nielsen.combe-bracciale@epitech.eu" class="popup-link">
                    ${Icons.Email}
                    Email Me
                </a>
                <a href="https://www.linkedin.com/in/nielsen-combebracciale/" target="_blank" rel="noopener" class="popup-link">
                    ${Icons.LinkedIn}
                    LinkedIn
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
