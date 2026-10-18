/**
 * Translation helpers for the build (vite-plugins/pages.ts, which pre-renders every page in every language) and for
 * tests. Browser code imports src/core/lang.ts and src/core/i18n.ts instead: this file carries every dictionary.
 * No side effects and no '@/' imports, so Node can load this file from vite.config.ts.
 */
import { en } from '../i18n/en.ts';
import { fr } from '../i18n/fr.ts';
import { lookupIn, type Lang } from './lang.ts';

export { DEFAULT_LANG, LANGS, langOfPath, localizedPath, type Lang, type Text } from './lang.ts';

const dictionaries: Record<Lang, typeof en> = { en, fr };

/** Look up a dotted key ('projectPage.back'); falls back to the key itself so gaps are visible. */
export function lookup(lang: Lang, key: string): string {
    return lookupIn(dictionaries[lang], key);
}

/**
 * The strings the home page's scripts write at runtime (toasts, labels, the map's cards): the `home` part of one
 * language, embedded in the page as JSON so the browser never downloads both dictionaries.
 */
export function clientStrings(lang: Lang): { home: (typeof en)['home'] } {
    return { home: dictionaries[lang].home };
}

/** Fill every [data-i18n] element under `root` with its translation. */
export function translateTree(root: ParentNode, lang: Lang): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key) el.innerHTML = lookup(lang, key);
    });
    // Image descriptions: a data-i18n-alt key translates the alt attribute
    root.querySelectorAll<HTMLElement>('[data-i18n-alt]').forEach((el) => {
        el.setAttribute('alt', lookup(lang, el.getAttribute('data-i18n-alt')!));
    });
}
