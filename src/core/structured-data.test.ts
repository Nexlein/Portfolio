import { describe, expect, it } from 'vitest';
import { SKILLS } from '@/data/profile';
import { PROJECTS } from '@/data/projects';
import { OWNER } from './site';
import { cvPerson, profilePage, projectSource, SKILL_ENTITIES } from './structured-data';

describe('projectSource', () => {
    const image = 'https://example.test/og.jpg';

    it('names the repository only when the project has one', () => {
        const withRepo = projectSource({ ...PROJECTS[0], github: 'https://github.com/x/y' }, 'en', 'd', image);
        expect(withRepo.codeRepository).toBe('https://github.com/x/y');
        const without = projectSource({ ...PROJECTS[0], github: '' }, 'en', 'd', image);
        expect('codeRepository' in without).toBe(false);
    });

    it('keeps the language in the url and the keywords as one list', () => {
        const fr = projectSource(PROJECTS[0], 'fr', 'd', image);
        expect(fr.url).toBe(`https://nexlein.vercel.app/fr/projects/${PROJECTS[0].id}.html`);
        expect(fr.inLanguage).toBe('fr');
        expect(fr.keywords).toBe(PROJECTS[0].tags.join(', '));
    });
});

describe('the structured data adds', () => {
    it('the month a project was started', () => {
        expect(projectSource(PROJECTS[0], 'en', 'd', 'https://example.test/og.jpg').dateCreated).toBe(PROJECTS[0].date);
    });

    it('the website to the home page, with the same id in both languages', () => {
        const [en, fr] = (['en', 'fr'] as const).map((lang) => profilePage(lang).isPartOf as Record<string, string>);
        expect(en).toMatchObject({ '@type': 'WebSite', name: 'Nexlein', url: 'https://nexlein.vercel.app/' });
        expect(fr['@id']).toBe(en['@id']);
    });
});

describe('the Person block', () => {
    const people = (['en', 'fr'] as const).flatMap((lang) => [
        profilePage(lang).mainEntity as Record<string, unknown>,
        cvPerson(lang)
    ]);

    it('lists spelling variants as alternate names, never the displayed name', () => {
        for (const person of people) {
            const names = person.alternateName as string[];
            expect(names).toContain(OWNER.alias);
            expect(names).not.toContain(OWNER.name);
            expect(new Set(names).size).toBe(names.length);
            expect(person.name).toBe(OWNER.name);
        }
    });

    it('lists every skill once, in CV order, under the names search engines know', () => {
        const items = SKILLS.flatMap((group) => group.items.flatMap((item) => SKILL_ENTITIES[item] ?? [item]));
        for (const person of people) {
            const known = person.knowsAbout as string[];
            expect(known).toEqual([...new Set(items)]);
            expect(known).toEqual(expect.arrayContaining(['C++', 'Reinforcement learning', 'Kubernetes']));
            expect(known.filter((name) => name.includes('('))).toEqual([]); // no CV shorthand like "RL (PPO, DQN)"
        }
    });

    it('maps only labels the CV actually shows', () => {
        const labels = SKILLS.flatMap((group) => group.items);
        for (const label of Object.keys(SKILL_ENTITIES)) expect(labels).toContain(label);
    });
});
