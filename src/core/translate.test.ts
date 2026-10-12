// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { langOfPath, localizedPath, lookup, translateTree } from './translate';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';

describe('lookup', () => {
    it('resolves nested keys per language', () => {
        expect(lookup('en', 'projectPage.back')).toBe(en.projectPage.back);
        expect(lookup('fr', 'projectPage.back')).toBe(fr.projectPage.back);
    });

    it('falls back to the key when it does not resolve to a string', () => {
        expect(lookup('en', 'does.not.exist')).toBe('does.not.exist');
        expect(lookup('en', 'projectPage')).toBe('projectPage');
        expect(lookup('en', 'projectPage.back.deeper')).toBe('projectPage.back.deeper');
    });
});

describe('translateTree', () => {
    it('fills every [data-i18n] element, HTML included', () => {
        document.body.innerHTML = '<h2 data-i18n="projectPage.code">x</h2><p data-i18n="missing.key">y</p>';
        translateTree(document, 'fr');
        expect(document.querySelector('h2')!.innerHTML).toBe(fr.projectPage.code);
        expect(document.querySelector('p')!.innerHTML).toBe('missing.key');
    });
});

describe('localized paths', () => {
    it.each([
        ['/', 'en'],
        ['/cv.html', 'en'],
        ['/fr/', 'fr'],
        ['/fr', 'fr'],
        ['/fr/availability.html', 'fr'],
        ['/french.html', 'en']
    ])('%s is %s', (path, lang) => {
        expect(langOfPath(path)).toBe(lang);
    });

    it.each([
        ['/', 'fr', '/fr/'],
        ['/cv.html', 'fr', '/fr/cv.html'],
        ['/fr/', 'en', '/'],
        ['/fr/cv.html', 'en', '/cv.html'],
        ['/fr/cv.html', 'fr', '/fr/cv.html'],
        ['/cv.html', 'en', '/cv.html']
    ] as const)('%s in %s is %s', (path, lang, expected) => {
        expect(localizedPath(path, lang)).toBe(expected);
    });
});
