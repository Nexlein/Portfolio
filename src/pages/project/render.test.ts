import { describe, expect, it } from 'vitest';
import { PROJECTS } from '@/data/projects';
import { sharedSkills } from './render';

const withTags = (tags: string[]) => ({ ...PROJECTS[0], tags });

describe('sharedSkills', () => {
    it('names what two projects share, in the other one’s spelling', () => {
        expect(sharedSkills(withTags(['python', 'Docker']), withTags(['Python', 'Rust']))).toEqual(['Python']);
    });

    it('finds a skill under another name', () => {
        expect(sharedSkills(withTags(['Reinforcement Learning']), withTags(['RL']))).toEqual([
            'Reinforcement Learning'
        ]);
    });

    it('names only the shared half of a tag holding two skills', () => {
        expect(sharedSkills(withTags(['C++']), withTags(['C/C++']))).toEqual(['C++']);
    });

    it('leaves out what they do not share', () => {
        expect(sharedSkills(withTags(['Python']), withTags(['Rust']))).toEqual([]);
    });
});
