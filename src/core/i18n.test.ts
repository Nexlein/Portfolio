// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { fr } from '@/i18n/fr';
import { clientStrings } from './translate';

/** The service reads <html lang> once, at import: load a fresh copy per page language. */
async function loadOnPage(lang: string, strings?: string) {
    document.documentElement.lang = lang;
    document.getElementById('i18n')?.remove();
    if (strings !== undefined) {
        const script = document.createElement('script');
        script.type = 'application/json';
        script.id = 'i18n';
        script.textContent = strings;
        document.head.append(script);
    }
    vi.resetModules();
    return import('./i18n');
}

describe('i18n service', () => {
    it("takes the page's language from <html lang>", async () => {
        expect((await loadOnPage('fr')).i18n.getLang()).toBe('fr');
        expect((await loadOnPage('en')).i18n.getLang()).toBe('en');
        expect((await loadOnPage('')).i18n.getLang()).toBe('en');
    });

    it('translates keys from the strings the build embedded in the page', async () => {
        const { i18n } = await loadOnPage('fr', JSON.stringify(clientStrings('fr')));
        expect(i18n.t('home.hire.copied')).toBe(fr.home.hire.copied);
    });

    it('shows the key when the page carries no strings, or broken ones', async () => {
        expect((await loadOnPage('fr')).i18n.t('home.hire.copied')).toBe('home.hire.copied');
        expect((await loadOnPage('fr', '{oops')).i18n.t('home.hire.copied')).toBe('home.hire.copied');
    });
});
