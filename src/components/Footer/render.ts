/**
 * Site footer, rendered at build time (data-render="footer"). Relative imports only: rendered from Node.
 */
import { localizedPath, lookup, type Lang } from '../../core/translate.ts';
import { OWNER } from '../../core/site.ts';

export function renderFooter(lang: Lang): string {
    const t = (key: string) => lookup(lang, `site.footer.${key}`);
    return `<footer class="footer">
  <span>${t('made')}</span>
  <nav aria-label="Contact">
    <a href="mailto:${OWNER.email}">${t('email')}</a>
    <a href="${OWNER.github}">GitHub</a>
    <a href="${OWNER.linkedin}">LinkedIn</a>
    <a href="${localizedPath('/cv.html', lang)}">CV</a>
    <a class="footer-source" href="${OWNER.source}">${t('source')} <span aria-hidden="true">›</span></a>
  </nav>
</footer>`;
}
