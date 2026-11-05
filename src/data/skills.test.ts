import { describe, expect, it } from 'vitest';
import { skillNames, skillsOf, skillsOfTag } from './skills';

describe('skillsOf', () => {
    it('lowercases, splits C/C++, trims, merges RL and drops empties', () => {
        expect(skillsOf(['C/C++', ' Python ', 'RL', 'Net / work', 'C/'])).toEqual([
            'c',
            'c++',
            'python',
            'reinforcement learning',
            'net',
            'work',
            'c'
        ]);
    });

    it('counts CI/CD as one skill', () => {
        expect(skillsOfTag('CI/CD')).toEqual(['ci/cd']);
    });

    it('knows RL and Reinforcement Learning are the same skill', () => {
        expect(skillsOfTag('RL')).toEqual(skillsOfTag('Reinforcement Learning'));
    });

    it('keeps the tools of a field as skills of their own', () => {
        expect(skillsOf(['Gymnasium', 'Stable-Baselines3'])).toEqual(['gymnasium', 'stable-baselines3']);
    });
});

describe('skillNames', () => {
    it('keeps the spelling of the tags', () => {
        const names = skillNames(['TypeScript', 'FastAPI', 'CI/CD', 'C# / ASP.NET']);
        expect(names.get('typescript')).toBe('TypeScript');
        expect(names.get('fastapi')).toBe('FastAPI');
        expect(names.get('ci/cd')).toBe('CI/CD');
        expect(names.get('asp.net')).toBe('ASP.NET');
    });

    it('names an alias by its full name', () => {
        expect(skillNames(['RL']).get('reinforcement learning')).toBe('Reinforcement Learning');
    });
});
