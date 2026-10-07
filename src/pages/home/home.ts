/**
 * Home page entry point.
 *
 * To add a new project, add a ProjectEntry in src/data/projects.ts.
 */

import { PROJECTS } from '@/data/projects';
import { translateDOM } from '@/core/i18n';
import { initAnalytics } from '@/core/analytics';
import { injectNavbar } from '@/components/Navbar/Navbar';
import { initNavShadow, initScrollSpy } from '@/components/Navbar/scroll';
import { initCvModal } from '@/components/CvModal/CvModal';
import { ProjectGrid } from '@/components/ProjectGrid/ProjectGrid';
import { ProjectModal } from '@/components/ProjectModal/ProjectModal';

function bootstrap(): void {
    initAnalytics();
    injectNavbar('home');
    initNavShadow();
    initScrollSpy();
    initCvModal();

    const modal = new ProjectModal();
    const grid = new ProjectGrid(PROJECTS, (project) => modal.open(project));
    grid.render();

    translateDOM();

    // Deep link: /?project=<id> opens that project's modal
    const linked = PROJECTS.find((p) => p.id === new URLSearchParams(window.location.search).get('project'));
    if (linked) {
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
        modal.open(linked);
    }
}

window.addEventListener('DOMContentLoaded', bootstrap);
