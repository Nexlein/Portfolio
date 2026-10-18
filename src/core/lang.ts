/**
 * Languages and localized paths: pure, with no dictionary attached, so browser code can use them without
 * downloading every translation (the dictionaries live in translate.ts, which the build uses).
 * No side effects and no '@/' imports, so Node can load this file from vite.config.ts.
 */
export type Lang = 'en' | 'fr';

export const LANGS: readonly Lang[] = ['en', 'fr'];

/** Text in every language. A missing language is a type error. */
export type Text = Record<Lang, string>;
export const DEFAULT_LANG: Lang = 'en';

/** Language of a URL path: '/fr/...' is French, everything else English. */
export function langOfPath(path: string): Lang {
    return path === '/fr' || path.startsWith('/fr/') ? 'fr' : 'en';
}

/** The same page in another language: '/cv.html' <-> '/fr/cv.html', '/' <-> '/fr/'. */
export function localizedPath(path: string, lang: Lang): string {
    const base = langOfPath(path) === 'fr' ? path.replace(/^\/fr(\/|$)/, '/') : path;
    return lang === DEFAULT_LANG ? base : `/${lang}${base}`;
}

/** Id of the JSON block the build writes into pages whose scripts need strings (src/core/i18n.ts reads it). */
export const STRINGS_ID = 'i18n';

/** Look up a dotted key ('projectPage.back') in a dictionary; falls back to the key itself so gaps are visible. */
export function lookupIn(dictionary: unknown, key: string): string {
    let node = dictionary;
    for (const part of key.split('.')) {
        if (!node || typeof node !== 'object') return key;
        node = (node as Record<string, unknown>)[part];
    }
    return typeof node === 'string' ? node : key;
}
