// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { outputFile, PAGES, renderPage, sitemap, type PageSpec } from '../../vite-plugins/pages';
import { HEAD_SCRIPT } from '../../vite-plugins/shared-head';
import { PROJECTS } from '@/data/projects';
import { SITE } from '@/core/site';
import { LANGS, localizedPath, lookup, type Lang } from '@/core/translate';

const sources = import.meta.glob<string>('../../*.html', { query: '?raw', import: 'default', eager: true });
const publicFiles = new Set(
    Object.keys(import.meta.glob('../../public/**/*')).map((p) => p.replace('../../public', ''))
);

function render(page: PageSpec, lang: Lang): Document {
    // The real build renders Vite's output, which already contains the injected redirect script
    const html = sources[`../../${page.template}`].replace('</head>', `<script>${HEAD_SCRIPT}</script></head>`);
    return new DOMParser().parseFromString(renderPage(html, page, lang), 'text/html');
}

const meta = (doc: Document, attr: string, name: string) =>
    doc.querySelector(`meta[${attr}="${name}"]`)?.getAttribute('content');

describe.each(PAGES.map((p) => [p.path, p] as const))('%s', (_path, page) => {
    describe.each(LANGS)('in %s', (lang) => {
        const doc = render(page, lang);
        const url = SITE + localizedPath(page.path, lang);

        it('sets <html lang> and translates every [data-i18n] element', () => {
            expect(doc.documentElement.lang).toBe(lang);
            const expected = doc.createElement('div'); // serialize the dictionary text the same way (& -> &amp;)
            for (const el of doc.querySelectorAll('[data-i18n]')) {
                expected.innerHTML = lookup(lang, el.getAttribute('data-i18n')!);
                expect(el.innerHTML, el.getAttribute('data-i18n')!).toBe(expected.innerHTML);
            }
        });

        it('has a localized title, a real description and matching social tags', () => {
            expect(doc.title).toBe(page.title(lang));
            const description = meta(doc, 'name', 'description')!;
            expect(description.length).toBeGreaterThan(50);
            expect(description).toBe(page.description(lang));
            expect(meta(doc, 'property', 'og:title')).toBe(doc.title);
            expect(meta(doc, 'property', 'og:description')).toBe(description);
            expect(meta(doc, 'property', 'og:url')).toBe(url);
            expect(meta(doc, 'property', 'og:locale')).toBe(lang === 'fr' ? 'fr_FR' : 'en_US');
            expect(meta(doc, 'name', 'twitter:card')).toBe('summary_large_image');
        });

        it('points og:image at a 1200x630 file that exists', () => {
            const image = meta(doc, 'property', 'og:image')!;
            expect(image.startsWith(SITE)).toBe(true);
            expect(publicFiles, `${image} (npm run media:og)`).toContain(image.slice(SITE.length));
        });

        it('points canonical at itself and lists every language as an alternate', () => {
            expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(url);
            const alternates = Object.fromEntries(
                [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [
                    l.getAttribute('hreflang'),
                    l.getAttribute('href')
                ])
            );
            expect(alternates).toEqual({
                en: SITE + page.path,
                fr: SITE + localizedPath(page.path, 'fr'),
                'x-default': SITE + page.path
            });
        });

        it('keeps the only executable inline script byte-identical (its CSP hash must match)', () => {
            const scripts = [...doc.querySelectorAll('script:not([src]):not([type="application/ld+json"])')];
            expect(scripts.map((s) => s.textContent)).toEqual([HEAD_SCRIPT]);
        });

        if (page.jsonLd)
            it('embeds valid JSON-LD', () => {
                const block = doc.querySelector('script[type="application/ld+json"]')!;
                const data = JSON.parse(block.textContent!);
                expect(data['@context']).toBe('https://schema.org');
                expect(data).toEqual(JSON.parse(JSON.stringify(page.jsonLd!(lang))));
            });
    });
});

describe('project pages', () => {
    it('exist for every project', () => {
        expect(PAGES.filter((p) => p.template === 'project.html').map((p) => p.path)).toEqual(
            PROJECTS.map((p) => `/projects/${p.id}.html`)
        );
    });

    describe.each(PROJECTS.map((p) => [p.id, p] as const))('%s', (id, project) => {
        const page = PAGES.find((p) => p.path === `/projects/${id}.html`)!;

        it.each(LANGS)('renders its content in %s', (lang) => {
            const doc = render(page, lang);
            expect(doc.getElementById('project-title')!.textContent).toBe(project.title);
            expect(doc.querySelectorAll('#project-tags .project-tag')).toHaveLength(project.tags.length);
            expect(doc.querySelector('#project-media video, #project-media img')).not.toBeNull();
            expect(doc.getElementById('project-back')!.getAttribute('href')).toBe(
                `${localizedPath('/', lang)}#projects`
            );
            const github = doc.getElementById('project-github');
            if (project.github) expect(github!.getAttribute('href')).toBe(project.github);
            else expect(github).toBeNull();
        });

        it('uses SoftwareSourceCode structured data pointing at the repository', () => {
            const data = page.jsonLd!('en') as Record<string, unknown>;
            expect(data['@type']).toBe('SoftwareSourceCode');
            if (project.github) expect(data.codeRepository).toBe(project.github);
        });
    });
});

describe('sitemap', () => {
    const xml = sitemap();

    it('lists every page in every language, once', () => {
        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        const expected = PAGES.flatMap((p) => LANGS.map((l) => SITE + localizedPath(p.path, l)));
        expect(locs).toEqual(expected);
    });

    it('declares hreflang alternates for each URL', () => {
        expect(xml.match(/<xhtml:link /g)).toHaveLength(PAGES.length * LANGS.length * (LANGS.length + 1));
        expect(xml).toContain(`hreflang="fr" href="${SITE}/fr/projects/zappy.html"`);
    });
});

describe('outputFile', () => {
    it.each([
        ['/', 'index.html'],
        ['/fr/', 'fr/index.html'],
        ['/cv.html', 'cv.html'],
        ['/fr/projects/zappy.html', 'fr/projects/zappy.html']
    ])('%s -> %s', (path, file) => {
        expect(outputFile(path)).toBe(file);
    });
});
