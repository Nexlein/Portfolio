/**
 * Project page entry point. The content is rendered at build time (src/pages/project/render.ts);
 * this adds the nav, the gallery, the video and the reveals.
 */
import { initAnalytics } from '@/core/analytics';
import { initNav } from '@/components/Nav/Nav';
import { initReveals } from '@/components/Charts/Charts';
import { prefersReducedMotion } from '@/ui/motion';
import { playVideosWhenVisible } from '@/ui/video';
import { initGallery } from './gallery';

/** Overlap bars fill to their share once revealed (CSSOM: the CSP forbids style attributes). */
function initOverlaps(): void {
    document.querySelectorAll<HTMLElement>('.overlap-fill').forEach((bar) => {
        bar.style.setProperty('--overlap', `${bar.dataset.overlap}%`);
    });
}

function bootstrap(): void {
    initAnalytics();
    initNav();
    initOverlaps();
    initReveals();

    const media = document.getElementById('project-media')!;
    const gallery = media.querySelector<HTMLElement>('.gallery');
    if (gallery) initGallery(gallery);
    playVideosWhenVisible(media);
    if (prefersReducedMotion()) media.querySelector('video')?.setAttribute('controls', ''); // no autoplay: let them press play
}

bootstrap();
