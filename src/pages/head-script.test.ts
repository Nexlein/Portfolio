// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEAD_SCRIPT } from '../../vite-plugins/shared-head';

/** Run the inline head script as a page would, with a made-up address, and report where it sent the visitor. */
function run({
    path,
    lang = 'en',
    staticPage = false,
    search = '',
    hash = ''
}: {
    path: string;
    lang?: string;
    staticPage?: boolean;
    search?: string;
    hash?: string;
}) {
    const root = document.documentElement;
    root.lang = lang;
    root.removeAttribute('data-static');
    if (staticPage) root.setAttribute('data-static', '');
    root.style.visibility = '';
    const replace = vi.fn();
    vi.stubGlobal('location', { pathname: path, search, hash, replace });
    new Function(HEAD_SCRIPT)(); // oxlint-disable-line typescript/no-implied-eval -- runs it as the page would
    return { replace, hidden: root.style.visibility === 'hidden' };
}

/** The visitor's stored choices, and whether their system prefers light. `null`: the browser blocks storage. */
function visitor(stored: Record<string, string> | null, light = false) {
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => {
            if (!stored) throw new DOMException('denied', 'SecurityError');
            return stored[key] ?? null;
        }
    });
    vi.stubGlobal('matchMedia', () => ({ matches: light }));
}

const theme = () => document.documentElement.getAttribute('data-theme');

describe('the head script on every page', () => {
    beforeEach(() => vi.stubGlobal('navigator', { language: 'en-US' }));
    afterEach(() => vi.unstubAllGlobals());

    it('applies the stored theme', () => {
        visitor({ theme: 'daylight' });
        run({ path: '/' });
        expect(theme()).toBe('daylight');
    });

    it('ignores a stored theme that is not a theme name, and follows the system', () => {
        visitor({ theme: 'Bad Value!' }, true);
        run({ path: '/' });
        expect(theme()).toBe('daylight');
        visitor({ theme: 'Bad Value!' }, false);
        run({ path: '/' });
        expect(theme()).toBe('midnight');
    });

    it('still works when the browser blocks storage', () => {
        visitor(null, true);
        expect(() => run({ path: '/' })).not.toThrow();
        expect(theme()).toBe('daylight');
    });

    it('sends a first visit from a French browser to the same address in French', () => {
        vi.stubGlobal('navigator', { language: 'fr-FR' });
        visitor({});
        const { replace, hidden } = run({ path: '/cv.html', search: '?a=1', hash: '#x' });
        expect(replace).toHaveBeenCalledWith('/fr/cv.html?a=1#x');
        expect(hidden).toBe(true);
    });

    it('leaves a French browser alone once a language was picked', () => {
        vi.stubGlobal('navigator', { language: 'fr-FR' });
        visitor({ lang: 'en' });
        expect(run({ path: '/cv.html' }).replace).not.toHaveBeenCalled();
    });
});

describe('the head script on the 404 page', () => {
    beforeEach(() => vi.stubGlobal('navigator', { language: 'en-US' }));
    afterEach(() => vi.unstubAllGlobals());

    it('moves an unknown /fr/ address to the French 404 page, without showing the English one first', () => {
        for (const path of ['/fr/nope', '/fr/a/b/c', '/fr']) {
            const { replace, hidden } = run({ path, staticPage: true });
            expect(replace, path).toHaveBeenCalledWith('/fr/404.html');
            expect(hidden).toBe(true);
        }
    });

    it('leaves an unknown English address on the English 404 page', () => {
        for (const path of ['/nope', '/404.html', '/frozen', '/france/x']) {
            expect(run({ path, staticPage: true }).replace, path).not.toHaveBeenCalled();
        }
    });

    it('does not loop: the French 404 page itself stays put', () => {
        expect(run({ path: '/fr/404.html', lang: 'fr', staticPage: true }).replace).not.toHaveBeenCalled();
    });

    it('does not touch ordinary pages under /fr/ or a French browser on the 404 page', () => {
        expect(run({ path: '/fr/cv.html', lang: 'fr' }).replace).not.toHaveBeenCalled();
        vi.stubGlobal('navigator', { language: 'fr-FR' });
        expect(run({ path: '/nope', staticPage: true }).replace).not.toHaveBeenCalled();
    });
});
