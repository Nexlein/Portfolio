// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fr } from '@/i18n/fr';

/** The service reads <html lang> once, at import: load a fresh copy per page language. */
async function loadOnPage(lang: string, path = '/') {
    document.documentElement.lang = lang;
    window.history.replaceState(null, '', path);
    vi.resetModules();
    return import('./i18n');
}

describe('i18n service', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        document.body.innerHTML = '';
    });

    it("takes the page's language from <html lang>", async () => {
        expect((await loadOnPage('fr')).i18n.getLang()).toBe('fr');
        expect((await loadOnPage('en')).i18n.getLang()).toBe('en');
        expect((await loadOnPage('')).i18n.getLang()).toBe('en');
    });

    it('translates keys and injected content in that language', async () => {
        const { i18n, translateDOM } = await loadOnPage('fr');
        expect(i18n.t('modal.github')).toBe(fr.modal.github);

        document.body.innerHTML = '<a data-i18n="modal.github"></a>';
        translateDOM();
        expect(document.querySelector('a')!.innerHTML).toBe(fr.modal.github);
    });

    it('switching remembers the choice and opens the same page in the other language', async () => {
        const { i18n } = await loadOnPage('en', '/cv.html?x=1#top');
        const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {});

        i18n.switchTo('fr');
        expect(localStorage.getItem('lang')).toBe('fr');
        expect(assign).toHaveBeenCalledWith('/fr/cv.html?x=1#top');
    });

    it('does nothing when switching to the current language', async () => {
        const { i18n } = await loadOnPage('fr', '/fr/');
        const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
        i18n.switchTo('fr');
        expect(assign).not.toHaveBeenCalled();
    });
});
