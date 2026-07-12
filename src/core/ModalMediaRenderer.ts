import { ProjectMedia } from '../data/projects.js';
import { Icons } from '../utils/Icons.js';

export class ModalMediaRenderer {
    static buildHtml(media: ProjectMedia): string {
        switch (media.type) {
            case 'video':
                return `<video src="${media.src}" autoplay loop muted playsinline></video>`;
            case 'image':
                return `<img src="${media.src}" alt="${media.alt}">`;
            case 'gallery':
                const imagesHtml = media.images
                    .map(
                        (img, i) =>
                            `<img src="${img.src}" alt="${img.alt}" class="${i === 0 ? 'active' : ''}" data-idx="${i}" loading="lazy">`
                    )
                    .join('');
                const dotsHtml = media.images
                    .map((_, i) => `<div class="gallery-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`)
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
                return `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:0.8rem;font-family:var(--font-mono)">No preview</div>`;
            }
        }
    }
}
