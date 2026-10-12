// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { fr } from '@/i18n/fr';

/** The service reads <html lang> once, at import: load a fresh copy per page language. */
async function loadOnPage(lang: string) {
    document.documentElement.lang = lang;
    vi.resetModules();
    return import('./i18n');
}

describe('i18n service', () => {
    it("takes the page's language from <html lang>", async () => {
        expect((await loadOnPage('fr')).i18n.getLang()).toBe('fr');
        expect((await loadOnPage('en')).i18n.getLang()).toBe('en');
        expect((await loadOnPage('')).i18n.getLang()).toBe('en');
    });

    it('translates keys in that language', async () => {
        const { i18n } = await loadOnPage('fr');
        expect(i18n.t('home.hire.copied')).toBe(fr.home.hire.copied);
    });
});
