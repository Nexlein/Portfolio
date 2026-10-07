import { describe, expect, it } from 'vitest';
import { buildModalMediaHtml } from './ModalMediaRenderer.js';

describe('buildModalMediaHtml', () => {
    it('renders an mp4 video', () => {
        const html = buildModalMediaHtml({ type: 'video', src: '/a/demo.mp4' });
        expect(html).toContain('<source src="/a/demo.mp4" type="video/mp4">');
        expect(html).toContain('muted');
    });

    it('detects webm by extension, case-insensitively', () => {
        expect(buildModalMediaHtml({ type: 'video', src: '/a/demo.WEBM' })).toContain('type="video/webm"');
    });

    it('renders an image with alt text', () => {
        expect(buildModalMediaHtml({ type: 'image', src: '/a.png', alt: 'Demo' })).toContain(
            '<img src="/a.png" alt="Demo" loading="lazy">'
        );
    });

    it('renders a gallery with the first image and dot active', () => {
        const html = buildModalMediaHtml({
            type: 'gallery',
            images: [
                { src: '/1.png', alt: 'One' },
                { src: '/2.png', alt: 'Two' },
                { src: '/3.png', alt: 'Three' }
            ]
        });
        expect(html.match(/<img /g)).toHaveLength(3);
        expect(html.match(/class="gallery-dot /g)).toHaveLength(3);
        expect(html).toContain('alt="One" class="active" data-idx="0"');
        expect(html).toContain('alt="Two" class="" data-idx="1"');
        expect(html).toContain('class="gallery-nav-btn prev"');
        expect(html).toContain('class="gallery-nav-btn next"');
    });
});
