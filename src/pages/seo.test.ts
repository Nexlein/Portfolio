import { describe, expect, it } from 'vitest';

const SITE = 'https://nexlein.vercel.app';

const pages = import.meta.glob<string>('../../*.html', { query: '?raw', import: 'default', eager: true });
const sitemap = import.meta.glob<string>('../../public/sitemap.xml', { query: '?raw', import: 'default', eager: true })[
    '../../public/sitemap.xml'
];

function meta(html: string, attr: 'name' | 'property', key: string): string | undefined {
    const tag = html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`));
    return tag?.[1];
}

describe.each(Object.entries(pages).map(([file, html]) => [file.replace('../../', ''), html]))('%s', (file, html) => {
    const path = file === 'index.html' ? '/' : `/${file}`;

    it('has a title and a meta description', () => {
        expect(html).toMatch(/<title>[^<]+<\/title>/);
        expect(meta(html, 'name', 'description')?.length).toBeGreaterThan(50);
    });

    it('declares its canonical URL', () => {
        expect(html).toContain(`<link rel="canonical" href="${SITE}${path}" />`);
    });

    it('has social preview tags', () => {
        expect(meta(html, 'property', 'og:title')).toBeTruthy();
        expect(meta(html, 'property', 'og:description')).toBe(meta(html, 'name', 'description'));
        expect(meta(html, 'property', 'og:url')).toBe(`${SITE}${path}`);
        expect(meta(html, 'property', 'og:image')).toBe(`${SITE}/og-image.png`);
        expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image');
    });

    it('is listed in the sitemap in every language', () => {
        expect(sitemap).toContain(`<loc>${SITE}${path}</loc>`);
        expect(sitemap).toContain(`<loc>${SITE}/fr${path}</loc>`);
        expect(sitemap).toContain(`hreflang="fr" href="${SITE}/fr${path}"`);
    });
});

describe('og image', () => {
    it('exists in public/', () => {
        expect(Object.keys(import.meta.glob('../../public/og-image.png'))).toHaveLength(1);
    });
});
