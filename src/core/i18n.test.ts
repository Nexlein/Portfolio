// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { i18n, translateDOM } from './i18n';
import { en } from '@/i18n/en';
import { fr } from '@/i18n/fr';

describe('i18n', () => {
    afterEach(() => {
        i18n.setLang('en');
        document.body.innerHTML = '';
    });

    it('resolves nested keys in the current language', () => {
        i18n.setLang('en');
        expect(i18n.t('modal.github')).toBe(en.modal.github);
        i18n.setLang('fr');
        expect(i18n.t('modal.github')).toBe(fr.modal.github);
    });

    it('falls back to the key when it does not resolve to a string', () => {
        expect(i18n.t('does.not.exist')).toBe('does.not.exist');
        expect(i18n.t('modal')).toBe('modal');
        expect(i18n.t('modal.github.deeper')).toBe('modal.github.deeper');
    });

    it('persists the language and updates <html lang>', () => {
        i18n.setLang('fr');
        expect(i18n.getLang()).toBe('fr');
        expect(localStorage.getItem('lang')).toBe('fr');
        expect(document.documentElement.lang).toBe('fr');
    });

    it('re-translates the DOM and notifies subscribers on change', () => {
        document.body.innerHTML = '<a data-i18n="modal.github"></a>';
        translateDOM();
        expect(document.querySelector('a')?.innerHTML).toBe(en.modal.github);

        let calls = 0;
        i18n.subscribe(() => calls++);
        i18n.setLang('fr');
        expect(document.querySelector('a')?.innerHTML).toBe(fr.modal.github);
        expect(calls).toBe(1);

        i18n.setLang('fr');
        expect(calls).toBe(1);
    });
});
