// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEAD_SCRIPT } from '../../vite-plugins/shared-head';

/** Run the inline head script as a page would, with a made-up address, and report where it sent the visitor. */
function run({ path, lang = 'en', staticPage = false }: { path: string; lang?: string; staticPage?: boolean }) {
    const root = document.documentElement;
    root.lang = lang;
    root.removeAttribute('data-static');
    if (staticPage) root.setAttribute('data-static', '');
    root.style.visibility = '';
    const replace = vi.fn();
    vi.stubGlobal('location', { pathname: path, search: '', hash: '', replace });
    new Function(HEAD_SCRIPT)();
    return { replace, hidden: root.style.visibility === 'hidden' };
}

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
