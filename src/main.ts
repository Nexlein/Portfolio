/**
 * src/main.ts — Application entry point.
 *
 * To add a new project:
 *  Add a ProjectEntry in src/data/projects.ts  ← that's it.
 */

import { PROJECTS } from './data/projects.js';
import { ProjectManager } from './core/ProjectManager.js';
import { ScrollObserver } from './core/ScrollObserver.js';
import { NavShadow } from './core/NavShadow.js';
import { ProjectModal } from './core/ProjectModal.js';
import { CvModal } from './core/CvModal.js';
import { injectNavbar } from './core/Components.js';
import { i18n, translateDOM } from './core/i18n.js';

// ── Boot ───────────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
    injectNavbar('home');
    new CvModal();
    new ProjectModal(PROJECTS); // attach modal

    // Hand off to the UI controllers
    const projectManager = new ProjectManager(PROJECTS);
    const scrollObserver = new ScrollObserver();
    const navShadow = new NavShadow();

    translateDOM();
    i18n.subscribe(() => {
        projectManager.render();
    });

    // Handle ?project= auto-open
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
        requestAnimationFrame(() => {
            const card = document.querySelector(`.project-card[data-project-id="${projectId}"]`) as HTMLElement;
            if (card) {
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                card.click();
            }
        });
    }

    // Expose for console debugging
    window.__portfolio = { projectManager, scrollObserver, navShadow };
}

declare global {
    interface Window {
        __portfolio: {
            projectManager: ProjectManager;
            scrollObserver: ScrollObserver;
            navShadow: NavShadow;
        };
    }
}

window.addEventListener('DOMContentLoaded', bootstrap);
