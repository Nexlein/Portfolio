// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { BLOCKS, renderContent } from './render';
import { EDUCATION, EXPERIENCES, OFFERS, SKILLS, TIMELINE } from '@/data/profile';
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
        it('renders the whole timeline in order, with the organization when known', () => {
            const items = render('timeline', lang).querySelectorAll('.timeline-item');
            expect(items).toHaveLength(TIMELINE.length);
            const issanka = EXPERIENCES.find((e) => e.id === TIMELINE[0])!;
            expect(items[0].querySelector('.timeline-title')!.textContent).toContain(issanka.title[lang]);
            expect(items[0].querySelector('.highlight')!.textContent).toBe(`@ ${issanka.org}`);
        });

        it('renders every CV experience with its bullets', () => {
            const root = render('cv-experience', lang);
            expect(root.querySelectorAll(':scope > div')).toHaveLength(EXPERIENCES.length);
            expect(root.querySelectorAll('li')).toHaveLength(EXPERIENCES.flatMap((e) => e.highlights).length);
        });

        it('renders skills, education and offers', () => {
            expect(render('cv-skills', lang).querySelectorAll('h3')).toHaveLength(SKILLS.length);
            expect(render('cv-education', lang).querySelectorAll('h3')).toHaveLength(EDUCATION.length);
            const offers = render('offers', lang).querySelectorAll('.card-availability');
            expect(offers).toHaveLength(OFFERS.length);
            expect(offers[0].querySelectorAll('.avail-lbl')).toHaveLength(OFFERS[0].rows.length);
        });
    });
});
