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

        it('renders the CV contact links, with the real LinkedIn address as text', () => {
            const contact = render('cv-contact', lang);
            expect(contact.querySelectorAll('a')).toHaveLength(4);
            expect(contact.querySelector('a')!.getAttribute('href')).toMatch(/^mailto:/);
            expect(contact.textContent).toContain('linkedin.com/in/');
        });

        it('lists the certifications on their own, not among the studies', () => {
            expect(render('cv-certs', lang).textContent).toContain('Google Cloud');
            expect(render('cv-education', lang).textContent).not.toContain('Google Cloud');
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
            // Studies and certifications are two lists that together hold every entry
            const count = (block: string) => render(block, lang).querySelectorAll('h3').length;
            expect(count('cv-education') + count('cv-certs')).toBe(EDUCATION.length);
        });
    });
});
