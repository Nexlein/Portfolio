import { describe, expect, it } from 'vitest';
import { PROJECTS } from '@/data/projects';
import { projectSource } from './structured-data';

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
