import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { resolve } from 'node:path';

/**
 * Inject the <head> tags every page needs, so they live in one place.
 *
 * The inline script runs before first paint: it sets <html lang> from the saved or browser
 * language and, for French, hides the body until translateDOM() adds `.i18n-ready`, so
 * visitors never see the English source text flash.
 */
function sharedHead(): Plugin {
    const languageGuard = `(function () {
    var lang;
    try { lang = localStorage.getItem('lang'); } catch (e) {}
    if (lang !== 'en' && lang !== 'fr') lang = navigator.language.slice(0, 2) === 'fr' ? 'fr' : 'en';
    document.documentElement.lang = lang;
    if (lang === 'fr') document.documentElement.classList.add('i18n-pending');
})();`;

    const tags: HtmlTagDescriptor[] = [
        { tag: 'link', attrs: { rel: 'icon', type: 'image/jpeg', href: '/favicon.jpg' }, injectTo: 'head' },
        {
            tag: 'style',
            children: 'html.i18n-pending:not(.i18n-ready) body { visibility: hidden; }',
            injectTo: 'head'
        },
        { tag: 'script', children: languageGuard, injectTo: 'head' }
    ];

    return { name: 'shared-head', transformIndexHtml: () => tags };
}

export default defineConfig({
    plugins: [sharedHead()],
    resolve: {
        alias: { '@': resolve(import.meta.dirname, 'src') }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                availability: resolve(import.meta.dirname, 'availability.html'),
                cv: resolve(import.meta.dirname, 'cv.html')
            }
        }
    }
});
