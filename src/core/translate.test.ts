// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { langOfPath, localizedPath, lookup, translateTree } from './translate';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';

describe('lookup', () => {
    it('resolves nested keys per language', () => {
        expect(lookup('en', 'modal.github')).toBe(en.modal.github);
        expect(lookup('fr', 'modal.github')).toBe(fr.modal.github);
    });

    it('falls back to the key when it does not resolve to a string', () => {
        expect(lookup('en', 'does.not.exist')).toBe('does.not.exist');
        expect(lookup('en', 'modal')).toBe('modal');
        expect(lookup('en', 'modal.github.deeper')).toBe('modal.github.deeper');
    });
});

describe('translateTree', () => {
    it('fills every [data-i18n] element, HTML included', () => {
        document.body.innerHTML = '<h2 data-i18n="projects.title">x</h2><p data-i18n="missing.key">y</p>';
        translateTree(document, 'fr');
        expect(document.querySelector('h2')!.innerHTML).toBe(fr.projects.title);
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
