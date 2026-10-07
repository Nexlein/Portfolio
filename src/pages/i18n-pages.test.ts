// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { localizeHtml, pagePath, PAGES, SITE } from '../../vite-plugins/i18n-pages';
import { LANGUAGE_REDIRECT_SCRIPT } from '../../vite-plugins/shared-head';
import { LANGS, localizedPath, lookup, type Lang } from '@/core/translate';

const sources = import.meta.glob<string>('../../*.html', { query: '?raw', import: 'default', eager: true });
const source = (file: string) => sources[`../../${file}`];

function render(file: string, lang: Lang): Document {
    // The real build localizes Vite's output, which already contains the injected redirect script
    const html = source(file).replace('</head>', `<script>${LANGUAGE_REDIRECT_SCRIPT}</script></head>`);
    return new DOMParser().parseFromString(localizeHtml(html, file, lang), 'text/html');
}

const meta = (doc: Document, attr: string, name: string) =>
    doc.querySelector(`meta[${attr}="${name}"]`)?.getAttribute('content');

describe.each(Object.keys(PAGES))('%s', (file) => {
    const key = PAGES[file];

    describe.each(LANGS)('in %s', (lang) => {
        const doc = render(file, lang);
        const url = SITE + localizedPath(pagePath(file), lang);

        it('sets <html lang> and translates every [data-i18n] element', () => {
            expect(doc.documentElement.lang).toBe(lang);
            const elements = [...doc.querySelectorAll('[data-i18n]')];
            expect(elements.length).toBeGreaterThan(0);
            const expected = doc.createElement('div'); // serialize the dictionary text the same way (& -> &amp;)
            for (const el of elements) {
                expected.innerHTML = lookup(lang, el.getAttribute('data-i18n')!);
                expect(el.innerHTML).toBe(expected.innerHTML);
            }
        });

        it('uses the localized title, description and social tags', () => {
            const title = lookup(lang, `meta.${key}.title`);
            const description = lookup(lang, `meta.${key}.description`);
            expect(doc.title).toBe(title);
            expect(meta(doc, 'name', 'description')).toBe(description);
            expect(meta(doc, 'property', 'og:title')).toBe(title);
            expect(meta(doc, 'property', 'og:description')).toBe(description);
            expect(meta(doc, 'property', 'og:url')).toBe(url);
            expect(meta(doc, 'property', 'og:locale')).toBe(lang === 'fr' ? 'fr_FR' : 'en_US');
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
                en: SITE + pagePath(file),
                fr: SITE + localizedPath(pagePath(file), 'fr'),
                'x-default': SITE + pagePath(file)
            });
        });

        it('keeps the inline script byte-identical (its CSP hash must still match)', () => {
            const scripts = [...doc.querySelectorAll('script:not([src])')].map((s) => s.textContent);
            expect(scripts).toEqual([LANGUAGE_REDIRECT_SCRIPT]);
        });
    });
});
