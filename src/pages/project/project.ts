/**
 * Project page entry point. The content is rendered at build time (src/pages/project/render.ts);
 * this only adds the navbar, translations of injected UI and media behaviour.
 */
import { translateDOM } from '@/core/i18n';
import { initAnalytics } from '@/core/analytics';
import { injectNavbar } from '@/components/Navbar/Navbar';
import { initNavShadow } from '@/components/Navbar/scroll';
import { bindModalGallery } from '@/components/ProjectModal/gallery';
import { playVideosWhenVisible } from '@/ui/video';

document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    injectNavbar('projects');
    initNavShadow();
    translateDOM();

    const media = document.getElementById('project-media');
    if (media) {
        const images = media.querySelectorAll('.modal-gallery img').length;
        if (images > 0) bindModalGallery(media, images);
        playVideosWhenVisible(media);
    }
});
