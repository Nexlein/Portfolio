import { en } from '../i18n/en.js';
import { fr } from '../i18n/fr.js';

export type Lang = 'en' | 'fr';
export type LocaleString = { en: string; fr: string };

type Dictionary = typeof en;

class I18nService {
    private currentLang: Lang = 'en';
    private dictionaries: Record<Lang, Dictionary> = { en, fr };
    private listeners: (() => void)[] = [];

    constructor() {
        const stored = localStorage.getItem('lang') as Lang;
        if (stored && (stored === 'en' || stored === 'fr')) {
            this.currentLang = stored;
        } else {
            const browserLang = navigator.language.slice(0, 2);
            this.currentLang = browserLang === 'fr' ? 'fr' : 'en';
        }
        document.documentElement.lang = this.currentLang;

        // Listen to localStorage changes (e.g. from iframe or other tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'lang' && (e.newValue === 'en' || e.newValue === 'fr')) {
                this.currentLang = e.newValue as Lang;
                document.documentElement.lang = this.currentLang;
                translateDOM();
                this.notifyListeners();
            }
        });
    }

    getLang(): Lang {
        return this.currentLang;
    }

    setLang(lang: Lang) {
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        translateDOM();
        this.notifyListeners();
    }

    // Lookup a key like 'home.heroTitle'
    t(key: string): string {
        const parts = key.split('.');
        let obj: unknown = this.dictionaries[this.currentLang];
        for (const p of parts) {
            if (obj && typeof obj === 'object') {
                obj = (obj as Record<string, unknown>)[p];
            } else {
                return key;
            }
        }
        return typeof obj === 'string' ? obj : key;
    }

    // Returns the correct string from a LocaleString object
    t_obj(obj: string | LocaleString): string {
        if (typeof obj === 'string') return obj;
        return obj[this.currentLang] || obj.en;
    }

    subscribe(fn: () => void) {
        this.listeners.push(fn);
    }

    private notifyListeners() {
        this.listeners.forEach((fn) => fn());
    }
}

export function translateDOM(root: HTMLElement | Document = document) {
    const elements = root.querySelectorAll<HTMLElement>('[data-i18n]');
    elements.forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            el.innerHTML = i18n.t(key);
        }
    });
    document.documentElement.classList.add('i18n-ready');
}

export const i18n = new I18nService();
