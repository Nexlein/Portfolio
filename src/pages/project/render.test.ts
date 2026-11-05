import { describe, expect, it } from 'vitest';
import { PROJECTS } from '@/data/projects';
import { sharedTags } from './render';

const withTags = (tags: string[]) => ({ ...PROJECTS[0], tags });

describe('sharedTags', () => {
    it('names what two projects share, in the other one’s spelling', () => {
        expect(sharedTags(withTags(['python', 'Docker']), withTags(['Python', 'Rust']))).toEqual(['Python']);
    });

    it('finds a skill under another name', () => {
        expect(sharedTags(withTags(['Reinforcement Learning']), withTags(['RL']))).toEqual(['RL']);
    });

    it('matches a tag holding two skills on either one', () => {
        expect(sharedTags(withTags(['C++']), withTags(['C/C++']))).toEqual(['C/C++']);
    });

    it('leaves out what they do not share', () => {
        expect(sharedTags(withTags(['Python']), withTags(['Rust']))).toEqual([]);
    });
});
