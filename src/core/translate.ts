/**
 * Pure translation helpers, shared by the browser (src/core/i18n.ts) and the build
 * (vite-plugins/pages.ts, which pre-renders every page in every language).
 * No side effects and no '@/' imports, so Node can load this file from vite.config.ts.
 */
import { en } from '../i18n/en.ts';
import { fr } from '../i18n/fr.ts';

export type Lang = 'en' | 'fr';

export const LANGS: readonly Lang[] = ['en', 'fr'];

/** Text in every language. A missing language is a type error. */
export type Text = Record<Lang, string>;
export const DEFAULT_LANG: Lang = 'en';

const dictionaries: Record<Lang, typeof en> = { en, fr };

/** Look up a dotted key ('projects.title'); falls back to the key itself so gaps are visible. */
export function lookup(lang: Lang, key: string): string {
    let node: unknown = dictionaries[lang];
    for (const part of key.split('.')) {
        if (!node || typeof node !== 'object') return key;
        node = (node as Record<string, unknown>)[part];
    }
    return typeof node === 'string' ? node : key;
}

/** Fill every [data-i18n] element under `root` with its translation. */
export function translateTree(root: ParentNode, lang: Lang): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key) el.innerHTML = lookup(lang, key);
    });
}

/** Language of a URL path: '/fr/...' is French, everything else English. */
export function langOfPath(path: string): Lang {
    return path === '/fr' || path.startsWith('/fr/') ? 'fr' : 'en';
}

/** The same page in another language: '/cv.html' <-> '/fr/cv.html', '/' <-> '/fr/'. */
export function localizedPath(path: string, lang: Lang): string {
    const base = langOfPath(path) === 'fr' ? path.replace(/^\/fr(\/|$)/, '/') : path;
    return lang === DEFAULT_LANG ? base : `/${lang}${base}`;
}
