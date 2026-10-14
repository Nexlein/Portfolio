import { describe, expect, it } from 'vitest';
import { CHECKPOINTS, EXPERIENCES } from '@/data/profile';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { periodOf } from '../NeuralMap/graph';
import {
    distinctSkills,
    domainAxes,
    languageBuckets,
    languageOf,
    learnedSince,
    newSkillsPerPeriod,
    skillSeries,
    skills,
    thisMonth,
    topSkills,
    valueAt,
    yearOf
} from './data';

/** The skills known at the end of a series. */
const last = (points: ReturnType<typeof skillSeries>) => points[points.length - 1].v;

/** A project with only what the numbers read: a month and some tags. */
const project = (id: string, date: string, tags: string[]): ProjectEntry => ({ ...PROJECTS[0], id, date, tags });

describe('dates', () => {
    it('reads a month as a fractional year (January is the year itself)', () => {
        expect(yearOf('2026-01')).toBe(2026);
        expect(yearOf('2026-04')).toBe(2026.25);
        expect(yearOf('2026-12')).toBeCloseTo(2026 + 11 / 12);
    });

    it('puts today at the start of the current month', () => {
        expect(thisMonth(new Date('2026-10-14'))).toBeCloseTo(2026 + 9 / 12);
        expect(thisMonth(new Date('2027-01-31'))).toBe(2027);
    });

    it('treats a project without a year as second-year work', () => {
        expect(periodOf({ ...PROJECTS[0], year: undefined })).toBe('Tek2');
    });
});

describe('skills', () => {
    it('lowercases, splits C/C++, trims, merges RL and drops empties', () => {
        expect(skills(['C/C++', ' Python ', 'RL', 'Net / work', 'C/'])).toEqual([
            'c',
            'c++',
            'python',
            'reinforcement learning',
            'net',
            'work',
            'c'
        ]);
    });
});

/** What the path chart says ("58 skills", "+37 in 12 months"), recomputed the plain way for the tests to compare with. */
const known = (t: number) => {
    const all: [number, string[]][] = [
        ...PROJECTS.map((p): [number, string[]] => [yearOf(p.date), skills(p.tags)]),
        ...CHECKPOINTS.map((c): [number, string[]] => [
            yearOf(c.date),
            skills([...(c.skills ?? []), ...(EXPERIENCES.find((e) => e.id === c.id)?.tags ?? [])])
        ])
    ];
    return new Set(all.filter(([d]) => d <= t).flatMap(([, s]) => s)).size;
};

describe('the toolbox over time', () => {
    it.each([2024.5, 2025, 2025.75, 2026.25, thisMonth(new Date('2026-10-14'))])(
        'counts the same skills at %s',
        (t) => {
            const series = skillSeries(PROJECTS, t);
            expect(series[series.length - 1].v).toBe(known(t));
            expect(valueAt(series, t - 1)).toBe(known(t - 1));
        }
    );

    it('never goes down', () => {
        const values = skillSeries(PROJECTS, thisMonth()).map((p) => p.v);
        expect(values).toEqual([...values].sort((a, b) => a - b)); // eslint-disable-line -- test-only copy
    });

    it('counts a project from its own month on, and not a month before', () => {
        const may = project('may', '2099-05', ['Zig', 'Odin']);
        const at = yearOf('2099-05');
        expect(last(skillSeries([may], at)) - last(skillSeries([], at))).toBe(2);
        expect(last(skillSeries([may], at - 1 / 12)) - last(skillSeries([], at - 1 / 12))).toBe(0);
    });

    it('lists what was learned in the last 12 months, the boundary month excluded', () => {
        const now = yearOf('2099-06');
        const recent = project('recent', '2099-01', ['Zig']);
        const edge = project('edge', '2098-06', ['Odin']); // exactly a year ago: outside
        const future = project('future', '2099-07', ['Nim']);
        const learned = learnedSince([recent, edge, future], now);
        expect(learned).toContain('zig');
        expect(learned).not.toContain('odin');
        expect(learned).not.toContain('nim');
    });
});

describe('group counts', () => {
    it('gives every skill to the period that first used it, once', () => {
        expect(newSkillsPerPeriod(PROJECTS).reduce((a, b) => a + b, 0)).toBe(distinctSkills(PROJECTS));
    });

    it('ranks the most used skills first', () => {
        const top = topSkills(PROJECTS);
        expect(top.map(([, n]) => n)).toEqual([...top.map(([, n]) => n)].sort((a, b) => b - a)); // eslint-disable-line -- test-only copy
        expect(top.length).toBeLessThanOrEqual(7);
    });

    it('names the main language of a project, C/C++ as C++, and infrastructure when there is none', () => {
        expect(languageOf(project('a', '2026-01', ['Jenkins', 'C/C++']))).toBe('C++');
        expect(languageOf(project('b', '2026-01', ['Ansible', 'Vagrant']))).toBe('infra');
    });

    it('buckets every project exactly once', () => {
        const { keys, bucket } = languageBuckets(PROJECTS);
        for (const p of PROJECTS) expect(keys).toContain(bucket(p));
    });

    it('counts every project in one domain axis', () => {
        const { counts } = domainAxes(PROJECTS);
        expect(counts.reduce((a, b) => a + b, 0)).toBe(PROJECTS.length);
    });
});
