// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildModalMediaHtml } from './media';

function mockReducedMotion(reduce: boolean) {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: reduce } as MediaQueryList);
}

describe('buildModalMediaHtml', () => {
    afterEach(() => vi.restoreAllMocks());

    it('renders an autoplaying, muted mp4 video with its poster', () => {
        mockReducedMotion(false);
        const html = buildModalMediaHtml({ type: 'video', src: '/a/demo.mp4' });
        expect(html).toContain('<source src="/a/demo.mp4" type="video/mp4">');
        expect(html).toContain('poster="/a/demo.poster.webp"');
        expect(html).toMatch(/<video autoplay [^>]*muted/);
        expect(html).not.toContain('controls');
    });

    it('shows controls instead of autoplaying with reduced motion', () => {
        mockReducedMotion(true);
        const html = buildModalMediaHtml({ type: 'video', src: '/a/demo.mp4' });
        expect(html).toContain('<video controls ');
        expect(html).not.toContain('autoplay');
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
