import { lookupIn, STRINGS_ID, type Lang } from './lang';

export type { Lang };

/** The strings embedded in the page, or nothing (a page that needs none, a test). */
function embedded(): unknown {
    const json = document.getElementById(STRINGS_ID)?.textContent;
    if (!json) return {};
    try {
        return JSON.parse(json);
    } catch {
        return {};
    }
}

/**
 * Each page is built once per language (vite-plugins/pages.ts) and its <html lang> says which one.
 * The nav's EN/FR links go to the other page, so every language has its own URL. This only serves the few
 * strings scripts write at runtime (toasts, button labels), read from the JSON the build embeds in the page:
 * one language, not every dictionary in the bundle.
 */
class I18nService {
    private readonly lang: Lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
    private strings: unknown;

    getLang(): Lang {
        return this.lang;
    }

    /** Translate a dotted key ('home.hire.copied') in the page's language. */
    t(key: string): string {
        this.strings ??= embedded();
        return lookupIn(this.strings, key);
    }
}

export const i18n = new I18nService();
