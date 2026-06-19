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
        const savedLang = localStorage.getItem('lang') as Lang;
        if (savedLang === 'en' || savedLang === 'fr') {
            this.currentLang = savedLang;
        } else {
            // Default to browser language if available, else English
            const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
            this.currentLang = browserLang;
        }
        document.documentElement.lang = this.currentLang;
    }

    getLang(): Lang {
        return this.currentLang;
    }

    setLang(lang: Lang) {
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        this.translateDOM();
        this.notifyListeners();
    }

    // Lookup a key like 'home.heroTitle'
    t(key: string): string {
        const parts = key.split('.');
        let obj: any = this.dictionaries[this.currentLang];
        for (const p of parts) {
            if (obj && typeof obj === 'object') {
                obj = obj[p];
            } else {
                return key; // Fallback to key if not found
            }
        }
        return obj as string;
    }

    // Returns the correct string from a LocaleString object
    t_obj(obj: string | LocaleString): string {
        if (typeof obj === 'string') return obj;
        return obj[this.currentLang] || obj.en;
    }

    translateDOM(root: HTMLElement | Document = document) {
        const elements = root.querySelectorAll<HTMLElement>('[data-i18n]');
        elements.forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.innerHTML = this.t(key);
            }
        });
        document.documentElement.classList.add('i18n-ready');
    }

    subscribe(fn: () => void) {
        this.listeners.push(fn);
    }

    private notifyListeners() {
        this.listeners.forEach((fn) => fn());
    }
}

export const i18n = new I18nService();
