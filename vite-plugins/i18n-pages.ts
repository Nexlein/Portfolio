import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Window } from 'happy-dom';
import type { Plugin } from 'vite';
import { DEFAULT_LANG, LANGS, localizedPath, lookup, translateTree, type Lang } from '../src/core/translate.ts';

export const SITE = 'https://nexlein.vercel.app';

/** HTML entry -> its key under `meta.*` in the dictionaries. */
export const PAGES: Record<string, string> = {
    'index.html': 'home',
    'cv.html': 'cv',
    'availability.html': 'availability'
};

const OG_LOCALE: Record<Lang, string> = { en: 'en_US', fr: 'fr_FR' };

export function pagePath(file: string): string {
    return file === 'index.html' ? '/' : `/${file}`;
}

/**
 * Render a page in one language: <html lang>, every [data-i18n] text, the title, description,
 * Open Graph tags, canonical URL and hreflang alternates. Crawlers and link previews don't run
 * JavaScript, so this is what makes the French pages visible to them.
 */
export function localizeHtml(html: string, file: string, lang: Lang): string {
    const window = new Window();
    const document = new window.DOMParser().parseFromString(html, 'text/html');
    const head = document.head;
    const key = PAGES[file];
    const url = (l: Lang) => SITE + localizedPath(pagePath(file), l);

    const setMeta = (attr: 'name' | 'property', name: string, content: string) => {
        let meta = head.querySelector(`meta[${attr}="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attr, name);
            head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    };

    document.documentElement.setAttribute('lang', lang);
    translateTree(document as unknown as ParentNode, lang);

    const title = lookup(lang, `meta.${key}.title`);
    const description = lookup(lang, `meta.${key}.description`);
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url(lang));
    setMeta('property', 'og:image:alt', lookup(lang, 'meta.imageAlt'));
    setMeta('property', 'og:locale', OG_LOCALE[lang]);
    head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((el) => el.remove());
    for (const other of LANGS.filter((l) => l !== lang)) {
        const alt = document.createElement('meta');
        alt.setAttribute('property', 'og:locale:alternate');
        alt.setAttribute('content', OG_LOCALE[other]);
        head.appendChild(alt);
    }

    head.querySelector('link[rel="canonical"]')?.setAttribute('href', url(lang));
    head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    const alternates: [string, Lang][] = [...LANGS.map((l): [string, Lang] => [l, l]), ['x-default', DEFAULT_LANG]];
    for (const [hreflang, target] of alternates) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', hreflang);
        link.setAttribute('href', url(target));
        head.appendChild(link);
    }

    const out = `<!doctype html>\n${document.documentElement.outerHTML}\n`;
    void window.happyDOM.close();
    return out;
}

/**
 * Build every page once per language: the default language keeps its path (/cv.html),
 * the others get a prefix (/fr/cv.html). The dev server renders /fr/* on the fly.
 */
export function i18nPages(): Plugin {
    return {
        name: 'i18n-pages',
        enforce: 'post', // after Vite's HTML plugin has emitted the pages

        generateBundle(_options, bundle) {
            for (const [fileName, output] of Object.entries(bundle)) {
                if (output.type !== 'asset' || !(fileName in PAGES)) continue;
                const html = String(output.source);
                for (const lang of LANGS) {
                    const localized = localizeHtml(html, fileName, lang);
                    if (lang === DEFAULT_LANG) output.source = localized;
                    else this.emitFile({ type: 'asset', fileName: `${lang}/${fileName}`, source: localized });
                }
            }
        },

        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const path = (req.url ?? '').split(/[?#]/)[0];
                const lang = LANGS.find((l) => l !== DEFAULT_LANG && (path === `/${l}` || path.startsWith(`/${l}/`)));
                if (!lang) return next();
                const file = path.slice(lang.length + 2) || 'index.html';
                if (!(file in PAGES)) return next();

                const source = readFileSync(resolve(server.config.root, file), 'utf8');
                server
                    .transformIndexHtml(req.url ?? path, source)
                    .then((html) => {
                        res.setHeader('Content-Type', 'text/html; charset=utf-8');
                        res.end(localizeHtml(html, file, lang));
                    })
                    .catch(next); // surface errors in Vite's overlay instead of hanging the request
            });
        }
    };
}
