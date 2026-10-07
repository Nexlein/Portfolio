import { describe, expect, it } from 'vitest';
import { SITE } from '@/core/site';

// Per-page SEO (meta, canonical, hreflang, JSON-LD) is tested on the rendered output in pages.test.ts.

const robots = import.meta.glob<string>('../../public/robots.txt', { query: '?raw', import: 'default', eager: true })[
    '../../public/robots.txt'
];

describe('crawler files', () => {
    it('robots.txt allows everything and points at the generated sitemap', () => {
        expect(robots).toContain('Allow: /');
        expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    });

    it('the default social image exists', () => {
        expect(Object.keys(import.meta.glob('../../public/og-image.png'))).toHaveLength(1);
    });
});
