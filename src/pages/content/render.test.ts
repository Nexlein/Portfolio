// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { BLOCKS, renderContent } from './render';
import { EDUCATION, EXPERIENCES, SKILLS } from '@/data/profile';
import { LANGS } from '@/core/translate';

const templates = import.meta.glob<string>('../../../*.html', { query: '?raw', import: 'default', eager: true });
const used = new Set(
    Object.values(templates).flatMap((html) => [...html.matchAll(/data-render="([^"]+)"/g)].map((m) => m[1]))
);

function render(block: string, lang: (typeof LANGS)[number]) {
    document.body.innerHTML = `<div data-render="${block}"></div>`;
    renderContent(document, lang);
    return document.body.firstElementChild!;
}

describe('content blocks', () => {
    it('every block a template asks for exists, and every block is used', () => {
        expect(used).toEqual(new Set(Object.keys(BLOCKS)));
    });

    it('fails loudly on an unknown block instead of leaving a gap', () => {
        document.body.innerHTML = '<div data-render="nope"></div>';
        expect(() => renderContent(document, 'en')).toThrow(/Unknown data-render block "nope"/);
    });

    describe.each(LANGS)('in %s', (lang) => {
        it('renders every CV experience with its bullets', () => {
            const root = render('cv-experience', lang);
            expect(root.querySelectorAll(':scope > div')).toHaveLength(EXPERIENCES.length);
            expect(root.querySelectorAll('li')).toHaveLength(EXPERIENCES.flatMap((e) => e.highlights).length);
        });

        it('renders the CV contact links and the toolbox sparkline', () => {
            expect(render('cv-contact', lang).querySelectorAll('a')).toHaveLength(4);
            expect(render('cv-contact', lang).querySelector('a')!.getAttribute('href')).toMatch(/^mailto:/);
            const toolbox = render('cv-toolbox', lang);
            expect(toolbox.querySelector('.cv-spark-line')!.getAttribute('d')).toMatch(/^M[\d.]+ [\d.]+L/);
            expect(toolbox.textContent).toMatch(/\d+/);
        });

        it('links CV projects to their pages, in the same language', () => {
            const links = [...render('cv-projects-ai', lang).querySelectorAll('h3 a')].map((a) =>
                a.getAttribute('href')
            );
            expect(links.length).toBeGreaterThan(0);
            for (const href of links) expect(href).toContain(`${lang === 'fr' ? '/fr' : ''}/projects/`);
        });

        it('renders skills and education', () => {
            expect(render('cv-skills', lang).querySelectorAll('h3')).toHaveLength(SKILLS.length);
            expect(render('cv-education', lang).querySelectorAll('h3')).toHaveLength(EDUCATION.length);
        });
    });
});
