// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { BLOCKS, renderContent } from './render';
import { CV_PROJECTS, EDUCATION, EXPERIENCES, SKILLS } from '@/data/profile';
import { LANGS } from '@/core/translate';
import { typeset } from '../cv/blocks';

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

        it('links CV projects to their pages, in the same language, in both columns', () => {
            for (const group of CV_PROJECTS) {
                const links = [...render(`cv-projects-${group.id}`, lang).querySelectorAll('h3 a')].map((a) =>
                    a.getAttribute('href')
                );
                // A grouped entry (AI Racing & Blackjack AI) links both projects
                expect(links).toHaveLength(group.projects.reduce((n, e) => n + (e.also ? 2 : 1), 0));
                for (const href of links) expect(href).toContain(`${lang === 'fr' ? '/fr' : ''}/projects/`);
            }
        });

        it('keeps each skill whole and the dots with the skill before them', () => {
            const groups = [...render('cv-skills', lang).querySelectorAll('.cv-group p')];
            expect(groups).toHaveLength(SKILLS.length);
            groups.forEach((p, i) => {
                expect(p.querySelectorAll('.cv-skill')).toHaveLength(SKILLS[i].items.length);
                expect(p.innerHTML).not.toMatch(/ · /);
            });
        });

        it('renders skills and education', () => {
            expect(render('cv-skills', lang).querySelectorAll('h3')).toHaveLength(SKILLS.length);
            // Studies and certifications are two lists that together hold every entry
            const count = (block: string) => render(block, lang).querySelectorAll('h3').length;
            expect(count('cv-education') + count('cv-certs')).toBe(EDUCATION.length);
        });
    });
});

describe('line breaks on the CV', () => {
    it('in French, puts a non-breaking space before ; : ! ? % », after «, and inside numbers', () => {
        expect(typeset('fr', 'mémoire ; 1 406 tests (95 %) : « oui »')).toBe(
            'mémoire\u00a0; 1\u00a0406 tests (95\u00a0%)\u00a0: «\u00a0oui\u00a0»'
        );
        expect(typeset('fr', '1 234 567 requêtes')).toBe('1\u00a0234\u00a0567 requêtes');
    });

    it('keeps 191 ± 41 whole in every language', () => {
        expect(typeset('en', 'reward of 191 ± 41')).toBe('reward of 191\u00a0±\u00a041');
        expect(typeset('fr', 'moyenne de 191 ± 41')).toBe('moyenne de 191\u00a0±\u00a041');
    });

    it('leaves English spacing, years, scores and links alone', () => {
        expect(typeset('en', 'memory; 1 406 tests')).toBe('memory; 1 406 tests');
        for (const text of ['2025 - 2026', '(2025, 2026)', '835/990', '<a href="https://issanka.com">issanka.com</a>'])
            expect(typeset('fr', text)).toBe(text);
    });
});
