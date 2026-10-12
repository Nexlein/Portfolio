/**
 * Top navigation, rendered at build time in every language (data-render="nav"), so links, the language switch
 * and the theme menu are real HTML before any script runs. Nav.ts adds the behaviour.
 * Relative imports only: vite-plugins/pages.ts renders this from Node.
 */
import { localizedPath, lookup, type Lang } from '../../core/translate.ts';
import { THEMES } from './themes.ts';

const SECTIONS = ['work', 'path', 'hire'] as const;

/** `path` is the page being rendered, in the default language ('/', '/cv.html', '/projects/zappy.html'). */
export function renderNav(lang: Lang, path: string): string {
    const t = (key: string) => lookup(lang, `site.nav.${key}`);
    const home = localizedPath('/', lang);
    const onHome = path === '/';
    const anchor = (id: string) => (onHome ? `#${id}` : `${home}#${id}`);
    const languages = (['en', 'fr'] as const)
        .map(
            (l) =>
                `<a href="${localizedPath(path, l)}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`
        )
        .join('');
    const themes = THEMES.map(
        (id) =>
            `<button type="button" role="menuitemradio" aria-checked="false" data-theme-id="${id}"><span class="swatch" data-theme="${id}" aria-hidden="true"></span>${lookup(lang, `site.themes.${id}`)}</button>`
    ).join('');

    return `<header class="nav" id="nav">
  <a class="nav-name" href="${onHome ? '#top' : home}">Nielsen<span class="nav-last"> COMBE--BRACCIALE</span></a>
  <nav aria-label="${t('label')}">
    <span class="nav-pill" aria-hidden="true"></span>
    ${SECTIONS.map((id) => `<a class="nav-link" href="${anchor(id)}" data-section="${id}">${t(id)}</a>`).join('')}
    <span class="nav-lang" role="group" aria-label="${t('language')}">${languages}</span>
    <div class="nav-themes">
      <button type="button" class="nav-theme-btn press" aria-haspopup="menu" aria-expanded="false" aria-label="${t('theme')}"><span class="swatch" aria-hidden="true"></span></button>
      <div class="nav-theme-menu" role="menu">${themes}</div>
    </div>
    <a class="nav-cv press" href="${localizedPath('/cv.html', lang)}">${t('cv')}</a>
  </nav>
</header>`;
}
