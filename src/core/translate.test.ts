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

    it('stops the build on a key that does not resolve to a string', () => {
        expect(() => lookup('en', 'does.not.exist')).toThrow('does.not.exist');
        expect(() => lookup('en', 'projectPage')).toThrow('projectPage');
        expect(() => lookup('en', 'projectPage.back.deeper')).toThrow('projectPage.back.deeper');
    });

    it('fills the slots of a text', () => {
        expect(lookup('en', 'projectPage.overlap', { n: 40 })).toBe(en.projectPage.overlap.replace('{n}', '40'));
    });

    it('leaves a slot without a value for the browser to fill', () => {
        expect(lookup('en', 'home.work.showMore')).toBe(en.home.work.showMore);
    });
});

describe('translateTree', () => {
    it('fills every [data-i18n] element, HTML included', () => {
        document.body.innerHTML = '<h2 data-i18n="projectPage.code">x</h2>';
        translateTree(document, 'fr');
        expect(document.querySelector('h2')!.innerHTML).toBe(fr.projectPage.code);
    });

    it('stops on a data-i18n key the dictionaries do not have', () => {
        document.body.innerHTML = '<p data-i18n="missing.key">y</p>';
        expect(() => translateTree(document, 'fr')).toThrow('missing.key');
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
