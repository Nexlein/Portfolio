import { lookup, localizedPath, translateTree, type Lang } from './translate';

export type { Lang };

/**
 * Each page is built once per language (vite-plugins/i18n-pages.ts) and its <html lang>
 * says which one. Switching language navigates to the other page instead of rewriting
 * the DOM, so every language has its own URL for search engines and link previews.
 */
class I18nService {
    private readonly lang: Lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';

    getLang(): Lang {
        return this.lang;
    }

    /** Translate a dotted key ('modal.github') in the page's language. */
    t(key: string): string {
        return lookup(this.lang, key);
    }

    /** Remember the choice (it disables the first-visit redirect) and open the page in that language. */
    switchTo(lang: Lang): void {
        if (lang === this.lang) return;
        try {
            localStorage.setItem('lang', lang);
        } catch {
            // Storage blocked: the switch still works, it just isn't remembered
        }
        const { pathname, search, hash } = window.location;
        window.location.assign(localizedPath(pathname, lang) + search + hash);
    }
}

export const i18n = new I18nService();

/** Translate content injected at runtime (navbar, cards); static HTML arrives translated. */
export function translateDOM(root: ParentNode = document): void {
    translateTree(root, i18n.getLang());
}
