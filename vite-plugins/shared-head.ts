import type { HtmlTagDescriptor, Plugin } from 'vite';

/**
 * First visit from a French browser to an English page: redirect to the French page before
 * first paint. It never runs on French pages (a shared /fr/ link stays French), inside the CV
 * iframe, or once the visitor picked a language with the toggle (stored in localStorage).
 *
 * Inline code must match a sha256 hash in the Content-Security-Policy (vercel.json).
 * Editing it changes the hash: update vercel.json too (headers.test.ts prints the expected value).
 */
export const LANGUAGE_REDIRECT_SCRIPT = `(function () {
    var root = document.documentElement;
    if (root.lang !== 'en' || window.top !== window.self) return;
    var chosen;
    try { chosen = localStorage.getItem('lang'); } catch (e) {}
    if (chosen || navigator.language.slice(0, 2) !== 'fr') return;
    root.style.visibility = 'hidden';
    location.replace('/fr' + location.pathname + location.search + location.hash);
})();`;

/** Inject the <head> tags every page needs, so they live in one place. */
export function sharedHead(): Plugin {
    const tags: HtmlTagDescriptor[] = [
        {
            tag: 'link',
            attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
            injectTo: 'head'
        },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }, injectTo: 'head' },
        { tag: 'script', children: LANGUAGE_REDIRECT_SCRIPT, injectTo: 'head' }
    ];

    return { name: 'shared-head', transformIndexHtml: () => tags };
}
