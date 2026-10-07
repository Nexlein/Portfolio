// Relative imports (no '@/' alias): the build also renders this markup from Node (vite-plugins/pages.ts)
import type { ProjectMedia } from '../../data/projects.ts';
import { Icons } from '../../ui/icons.ts';
import { prefersReducedMotion, videoPoster, videoType } from '../../ui/video.ts';

export function buildModalMediaHtml(media: ProjectMedia): string {
    switch (media.type) {
        case 'video': {
            // With reduced motion, show controls instead of autoplaying
            const playback = prefersReducedMotion() ? 'controls' : 'autoplay';
            return `<video ${playback} loop muted playsinline preload="auto" poster="${videoPoster(media.src)}"><source src="${media.src}" type="${videoType(media.src)}"></video>`;
        }
        case 'image':
            return `<img src="${media.src}" alt="${media.alt}" loading="lazy">`;
        case 'gallery':
            const imagesHtml = media.images
                .map(
                    (img, i) =>
                        `<img src="${img.src}" alt="${img.alt}" class="${i === 0 ? 'active' : ''}" data-idx="${i}" loading="lazy">`
                )
                .join('');
            const dotsHtml = media.images
                .map((_, i: number) => `<div class="gallery-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`)
                .join('');
            return `
            <div class="modal-gallery">
                ${imagesHtml}
                <div class="gallery-nav-btn prev">
                    ${Icons.Prev}
                </div>
                <div class="gallery-nav-btn next">
                    ${Icons.Next}
                </div>
                <div class="gallery-dots">${dotsHtml}</div>
            </div>`;
        default: {
            return `<div class="modal-media-empty">No preview</div>`;
        }
    }
}
