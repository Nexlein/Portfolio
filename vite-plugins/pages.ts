import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Window } from 'happy-dom';
import type { Plugin } from 'vite';
import { PROJECTS, projectImage, projectPath } from '../src/data/projects.ts';
import { OWNER, SITE } from '../src/core/site.ts';
import { jsonBlock } from '../src/core/text.ts';
import { cvPerson, profilePage, projectSource } from '../src/core/structured-data.ts';
import {
    clientStrings,
    DEFAULT_LANG,
    LANGS,
    langOfPath,
    localizedPath,
    lookup,
    translateTree,
    type Lang
} from '../src/core/translate.ts';
import { STRINGS_ID } from '../src/core/lang.ts';
import { renderContent } from '../src/pages/content/render.ts';
import { fillProjectPage, projectDescription } from '../src/pages/project/render.ts';

/** One page of the site, in every language. */
export interface PageSpec {
    /** Path in the default language: '/', '/cv.html', '/projects/zappy.html'. */
    path: string;
    /** HTML entry the page is rendered from (a Vite input). */
    template: string;
    title: (lang: Lang) => string;
    description: (lang: Lang) => string;
    image: (lang: Lang) => string;
    imageAlt: (lang: Lang) => string;
    /** Open Graph type: 'website' unless a page says otherwise. */
    ogType?: string;
    jsonLd?: (lang: Lang) => object;
    /** Served as the 404: no canonical or language alternates, not in the sitemap. */
    unlisted?: boolean;
    /** Fill template-specific content before translation (project pages). */
    fill?: (document: Document, lang: Lang) => void;
    /** The page's scripts write text at runtime: embed their strings (src/core/i18n.ts). */
    strings?: boolean;
}

const OG_LOCALE: Record<Lang, string> = { en: 'en_US', fr: 'fr_FR' };
/** The site's social image, drawn per language by scripts/brand-images.ts. */
const DEFAULT_IMAGE = (lang: Lang) => `${SITE}/og-image${lang === 'fr' ? '-fr' : ''}.png`;

const fixedPage = (
    path: string,
    template: string,
    key: string,
    jsonLd?: PageSpec['jsonLd'],
    strings = false
): PageSpec => ({
    path,
    template,
    strings,
    title: (lang) => lookup(lang, `meta.${key}.title`),
    description: (lang) => lookup(lang, `meta.${key}.description`),
    image: DEFAULT_IMAGE,
    imageAlt: (lang) => lookup(lang, 'meta.imageAlt'),
    jsonLd,
    fill: (document, lang) => renderContent(document, lang, path) // data-render blocks (profile, nav, charts...)
});

/** Every page of the site. Adding a project to src/data/projects.ts adds its page here. */
export const PAGES: PageSpec[] = [
    fixedPage('/', 'index.html', 'home', profilePage, true),
    fixedPage('/cv.html', 'cv.html', 'cv', cvPerson),
    ...PROJECTS.map((project): PageSpec => {
        const image = SITE + projectImage(project.id);
        return {
            path: projectPath(project.id),
            template: 'project.html',
            title: () => `${project.title} — ${OWNER.name}`,
            description: (lang) => projectDescription(project, lang),
            image: () => image,
            imageAlt: () => project.title,
            ogType: 'article',
            jsonLd: (lang) => projectSource(project, lang, projectDescription(project, lang), image),
            fill: (document, lang) => {
                renderContent(document, lang, projectPath(project.id)); // nav and footer
                fillProjectPage(document, project, lang);
            }
        };
    })
];

/** The page Vercel serves for every unknown URL (/404.html, and /fr/404.html for the French copy). */
export const NOT_FOUND: PageSpec = {
    ...fixedPage('/404.html', '404.html', 'notFound'),
    unlisted: true,
    fill: (document, lang) => {
        renderContent(document, lang, '/404.html'); // nav and footer
        document.getElementById('nf-home')!.setAttribute('href', localizedPath('/', lang));
        document.getElementById('nf-work')!.setAttribute('href', `${localizedPath('/', lang)}#work`);
    }
};

/** Everything the build renders; only PAGES are in the sitemap. */
const RENDERED = [...PAGES, NOT_FOUND];

/** Output file for a URL path: '/' -> 'index.html', '/fr/' -> 'fr/index.html'. */
export function outputFile(path: string): string {
    return (path.endsWith('/') ? `${path}index.html` : path).slice(1);
}

/**
 * Render one page in one language: template content, <html lang>, every [data-i18n] text, title,
 * description, Open Graph tags, canonical URL, hreflang alternates and JSON-LD. Crawlers and link
 * previews don't run JavaScript, so everything they need is in the HTML.
 */
export function renderPage(html: string, page: PageSpec, lang: Lang): string {
    const window = new Window();
    const document = new window.DOMParser().parseFromString(html, 'text/html') as unknown as Document;
    const head = document.head;
    const url = (l: Lang) => SITE + localizedPath(page.path, l);

    const appendHead = (tag: string, attrs: Record<string, string>) => {
        const el = document.createElement(tag);
        for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
        head.appendChild(el);
        return el;
    };

    document.documentElement.setAttribute('lang', lang);
    page.fill?.(document, lang);
    translateTree(document, lang);

    const title = page.title(lang);
    const description = page.description(lang);
    appendHead('title', {}).textContent = title;
    appendHead('meta', { name: 'description', content: description });
    const openGraph = {
        type: page.ogType ?? 'website',
        site_name: OWNER.alias,
        title,
        description,
        url: url(lang),
        image: page.image(lang),
        'image:width': '1200',
        'image:height': '630',
        'image:alt': page.imageAlt(lang),
        locale: OG_LOCALE[lang]
    };
    for (const [name, content] of Object.entries(openGraph)) appendHead('meta', { property: `og:${name}`, content });
    for (const other of LANGS.filter((l) => l !== lang)) {
        appendHead('meta', { property: 'og:locale:alternate', content: OG_LOCALE[other] });
    }
    appendHead('meta', { name: 'twitter:card', content: 'summary_large_image' });

    if (!page.unlisted) {
        appendHead('link', { rel: 'canonical', href: url(lang) });
        for (const l of LANGS) appendHead('link', { rel: 'alternate', hreflang: l, href: url(l) });
        appendHead('link', { rel: 'alternate', hreflang: 'x-default', href: url(DEFAULT_LANG) });
    }

    if (page.jsonLd) {
        // A data block, never executed, so the CSP's script-src does not apply
        appendHead('script', { type: 'application/ld+json' }).textContent = jsonBlock(page.jsonLd(lang));
    }

    if (page.strings) {
        appendHead('script', { type: 'application/json', id: STRINGS_ID }).textContent = jsonBlock(clientStrings(lang));
    }

    const out = `<!doctype html>\n${document.documentElement.outerHTML}\n`;
    void window.happyDOM.close();
    return out;
}

/** sitemap.xml listing every page in every language, with hreflang alternates. */
function sitemapAlternates(path: string): string {
    return [...LANGS.map((l) => [l, l] as const), ['x-default', DEFAULT_LANG] as const]
        .map(
            ([hreflang, l]) =>
                `        <xhtml:link rel="alternate" hreflang="${hreflang}" href="${SITE}${localizedPath(path, l)}" />`
        )
        .join('\n');
}

export function sitemap(pages: PageSpec[] = PAGES): string {
    const urls = pages.flatMap((page) =>
        LANGS.map(
            (lang) =>
                `    <url>\n        <loc>${SITE}${localizedPath(page.path, lang)}</loc>\n${sitemapAlternates(page.path)}\n    </url>`
        )
    );
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

/** Find the page and language a request path serves, in dev. */
function pageForPath(path: string): { page: PageSpec; lang: Lang } | undefined {
    const lang = langOfPath(path);
    const page = RENDERED.find((p) => localizedPath(p.path, lang) === path || (p.path === '/' && path === `/${lang}`));
    return page && { page, lang };
}

/**
 * Render every page once per language: the default language keeps its path (/cv.html), others get
 * a prefix (/fr/cv.html). Project pages come from the project.html template, which is not published.
 * Also writes sitemap.xml. The dev server renders the same URLs on the fly.
 */
export function sitePages(): Plugin {
    return {
        name: 'site-pages',
        enforce: 'post', // after Vite's HTML plugin has emitted the built templates

        generateBundle(_options, bundle) {
            const templates = new Map<string, string>();
            for (const page of RENDERED) {
                const built = bundle[page.template];
                if (built?.type !== 'asset') this.error(`missing built template ${page.template}`);
                templates.set(page.template, String(built.source));
            }
            delete bundle['project.html'];

            for (const page of RENDERED) {
                for (const lang of LANGS) {
                    const source = renderPage(templates.get(page.template)!, page, lang);
                    const fileName = outputFile(localizedPath(page.path, lang));
                    const existing = bundle[fileName];
                    if (existing?.type === 'asset') existing.source = source;
                    else this.emitFile({ type: 'asset', fileName, source });
                }
            }
            this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() });
        },

        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const path = (req.url ?? '').split(/[?#]/)[0];
                if (path === '/sitemap.xml') {
                    res.setHeader('Content-Type', 'application/xml');
                    res.end(sitemap());
                    return;
                }
                const match = pageForPath(path === '/index.html' ? '/' : path);
                if (!match) return next();

                const source = readFileSync(resolve(server.config.root, match.page.template), 'utf8');
                server
                    .transformIndexHtml(req.url ?? path, source)
                    .then((html) => {
                        res.setHeader('Content-Type', 'text/html; charset=utf-8');
                        res.end(renderPage(html, match.page, match.lang));
                    })
                    .catch(next); // surface errors in Vite's overlay instead of hanging the request
            });
        }
    };
}
