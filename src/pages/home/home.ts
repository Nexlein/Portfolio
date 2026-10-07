/**
 * Home page entry point.
 *
 * To add a new project:
 *  Add a ProjectEntry in src/data/projects.ts  ← that's it.
 */

import { PROJECTS } from '@/data/projects';
import { ProjectManager } from '@/core/ProjectManager';
import { ScrollObserver } from '@/core/ScrollObserver';
import { NavShadow } from '@/components/NavShadow/NavShadow';
import { ProjectModal } from '@/components/ProjectModal/ProjectModal';
import { CvModal } from '@/components/CvModal/CvModal';
import { injectNavbar } from '@/components/Navbar/Navbar';
import { i18n, translateDOM } from '@/core/i18n';

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

    // Expose for console debugging (dev server only)
    if (import.meta.env.DEV) {
        window.__portfolio = { projectManager, scrollObserver, navShadow };
    }
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
