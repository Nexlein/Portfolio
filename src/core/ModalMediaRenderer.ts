import { ProjectMedia } from '../data/projects.js';

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
                            `<img src="${img.src}" alt="${img.alt}" class="${i === 0 ? 'active' : ''}" data-idx="${i}">`
                    )
                    .join('');
                const dotsHtml = media.images
                    .map((_, i) => `<div class="gallery-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`)
                    .join('');
                return `
                <div class="modal-gallery">
                    ${imagesHtml}
                    <div class="gallery-nav-btn prev">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </div>
                    <div class="gallery-nav-btn next">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                    <div class="gallery-dots">${dotsHtml}</div>
                </div>`;
            case 'placeholder':
            default: {
                const label = media.type === 'placeholder' ? (media.label ?? 'No preview') : 'No preview';
                return `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:0.8rem;font-family:var(--font-mono)">${label}</div>`;
            }
        }
    }
}
