import type { HtmlTagDescriptor, Plugin } from 'vite';

/**
 * Runs before first paint: sets <html lang> from the saved or browser language and, for French,
 * hides the body until translateDOM() adds `.i18n-ready`, so visitors never see the English
 * source text flash.
 *
 * Inline code must match a sha256 hash in the Content-Security-Policy (vercel.json).
 * Editing either string changes its hash: update vercel.json too (headers.test.ts checks it).
 */
export const LANGUAGE_GUARD_SCRIPT = `(function () {
    var lang;
    try { lang = localStorage.getItem('lang'); } catch (e) {}
    if (lang !== 'en' && lang !== 'fr') lang = navigator.language.slice(0, 2) === 'fr' ? 'fr' : 'en';
    document.documentElement.lang = lang;
    if (lang === 'fr') document.documentElement.classList.add('i18n-pending');
})();`;

export const LANGUAGE_GUARD_STYLE = 'html.i18n-pending:not(.i18n-ready) body { visibility: hidden; }';

/** Inject the <head> tags every page needs, so they live in one place. */
export function sharedHead(): Plugin {
    const tags: HtmlTagDescriptor[] = [
        {
            tag: 'link',
            attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
            injectTo: 'head'
        },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }, injectTo: 'head' },
        { tag: 'style', children: LANGUAGE_GUARD_STYLE, injectTo: 'head' },
        { tag: 'script', children: LANGUAGE_GUARD_SCRIPT, injectTo: 'head' }
    ];

    return { name: 'shared-head', transformIndexHtml: () => tags };
}
