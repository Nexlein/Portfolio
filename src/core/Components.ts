/**
 * src/core/Components.ts
 * Inject shared components to avoid HTML duplication.
 */

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
      </nav>
    </div>
    `;
    const header = document.createElement('header');
    header.className = 'topnav';
    header.id = 'topnav';
    header.innerHTML = html;
    document.body.prepend(header);
}

export function injectModal() {
    const html = `
    <button class="modal-close" id="modal-close" aria-label="Close project">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <div class="modal-inner">
      <div class="modal-media" id="modal-media"></div>
      <div class="modal-info">
        <div class="modal-tags" id="modal-tags"></div>
        <h2 class="modal-title" id="modal-title"></h2>
        <p class="modal-desc" id="modal-desc"></p>
        <a class="modal-github" id="modal-github" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
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
