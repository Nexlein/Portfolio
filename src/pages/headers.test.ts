import { describe, expect, it } from 'vitest';
import vercel from '../../vercel.json';
import { HEAD_SCRIPT } from '../../vite-plugins/shared-head';

const siteHeaders = Object.fromEntries(
    vercel.headers.find((rule) => rule.source === '/(.*)')!.headers.map((h) => [h.key, h.value])
);

const csp = Object.fromEntries(
    siteHeaders['Content-Security-Policy'].split(';').map((directive) => {
        const [name, ...values] = directive.trim().split(/\s+/);
        return [name, values];
    })
);

async function sha256(text: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return `'sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}'`;
}

describe('Content-Security-Policy', () => {
    it('allows the inline head script (theme + language) by hash, and nothing else inline', async () => {
        expect(csp['script-src']).toEqual(["'self'", await sha256(HEAD_SCRIPT)]);
        expect(csp['style-src']).toEqual(["'self'"]);
    });

    it('never allows unsafe-inline or unsafe-eval', () => {
        expect(siteHeaders['Content-Security-Policy']).not.toMatch(/unsafe-(inline|eval)/);
    });

    it('locks every fetch to our own origin', () => {
        for (const directive of ['default-src', 'img-src', 'media-src', 'font-src', 'connect-src', 'frame-src']) {
            expect(csp[directive], directive).toEqual(["'self'"]);
        }
        expect(csp['object-src']).toEqual(["'none'"]);
        expect(csp['frame-ancestors']).toEqual(["'self'"]); // the CV is framed by the home page only
    });
});

describe('security headers', () => {
    it.each([
        ['X-Content-Type-Options', 'nosniff'],
        ['X-Frame-Options', 'SAMEORIGIN'],
        ['Referrer-Policy', 'strict-origin-when-cross-origin']
    ])('sends %s: %s', (key, value) => {
        expect(siteHeaders[key]).toBe(value);
    });
});

describe('HTML pages', () => {
    const pages = import.meta.glob<string>('../../*.html', { query: '?raw', import: 'default', eager: true });

    it.each(Object.keys(pages))('%s has no inline style attributes or inline scripts (CSP blocks them)', (file) => {
        const html = pages[file];
        expect(html).not.toMatch(/\sstyle="/);
        expect(html).not.toMatch(/<script>(?!<\/script>)/);
        expect(html).not.toMatch(/\son[a-z]+="/); // inline event handlers
    });
});

describe('CV PDF redirects', () => {
    const release = 'https://github.com/Nexlein/Portfolio/releases/download/cv/';
    const redirects = Object.fromEntries(vercel.redirects.map((r) => [r.source, r.destination]));

    it.each([
        ['/cv.pdf', 'Nielsen-Combe-Bracciale-CV-EN.pdf'],
        ['/fr/cv.pdf', 'Nielsen-Combe-Bracciale-CV-FR.pdf']
    ])('%s points at %s in the rolling cv release (published by CI)', (source, file) => {
        expect(redirects[source]).toBe(release + file);
    });

    it('the redirects are temporary, so the target can change without browsers caching it', () => {
        for (const r of vercel.redirects.filter((rule) => rule.source.endsWith('cv.pdf')))
            expect(r.permanent).toBe(false);
    });
});

describe('retired pages', () => {
    const redirects = Object.fromEntries(vercel.redirects.map((r) => [r.source, r]));

    it.each([
        ['/availability.html', '/#hire'],
        ['/fr/availability.html', '/fr/#hire']
    ])('%s moves for good to %s', (source, destination) => {
        expect(redirects[source]).toMatchObject({ destination, permanent: true });
    });
});
