import { lookup, type Lang } from './translate';

export type { Lang };

/**
 * Each page is built once per language (vite-plugins/pages.ts) and its <html lang> says which one.
 * The nav's EN/FR links go to the other page, so every language has its own URL. This only serves the few
 * strings scripts write at runtime (toasts, button labels).
 */
class I18nService {
    private readonly lang: Lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';

    getLang(): Lang {
        return this.lang;
    }

    /** Translate a dotted key ('home.hire.copied') in the page's language. */
    t(key: string): string {
        return lookup(this.lang, key);
    }
}

export const i18n = new I18nService();
