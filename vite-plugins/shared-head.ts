import type { HtmlTagDescriptor, Plugin } from 'vite';

/**
 * Runs in <head> before first paint, on every page:
 * 1. Theme: apply the visitor's stored theme (any lowercase name, so adding a theme never changes this script),
 *    else Daylight for a light system preference, else Midnight. CSS keys every theme on html[data-theme].
 *    Also marks html.js, so content waiting for a scroll reveal stays visible without JavaScript.
 * 2. Language: first visit from a French browser to an English page redirects to the French page. It never runs
 *    on French pages (a shared /fr/ link stays French), inside the CV iframe, or once the visitor picked a
 *    language with the toggle (stored in localStorage).
 *
 * Inline code must match a sha256 hash in the Content-Security-Policy (vercel.json).
 * Editing it changes the hash: update vercel.json too (headers.test.ts prints the expected value).
 */
export const HEAD_SCRIPT = `(function () {
    var root = document.documentElement;
    var theme, chosen;
    try { theme = localStorage.getItem('theme'); chosen = localStorage.getItem('lang'); } catch (e) {}
    if (!/^[a-z-]{1,24}$/.test(theme || '')) {
        theme = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'daylight' : 'midnight';
    }
    root.setAttribute('data-theme', theme);
    root.classList.add('js');
    if (root.lang !== 'en' || window.top !== window.self) return;
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
        { tag: 'script', children: HEAD_SCRIPT, injectTo: 'head' }
    ];

    return { name: 'shared-head', transformIndexHtml: () => tags };
}
