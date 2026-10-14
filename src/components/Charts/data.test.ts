import { describe, expect, it } from 'vitest';
import { CHECKPOINTS, EXPERIENCES } from '@/data/profile';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { periodOf } from '../NeuralMap/graph';
import { changeText, numbers, pathChart, pathSvg, phaseLabel } from './render';
import {
    distinctSkills,
    domainAxes,
    languageBuckets,
    languageOf,
    learnedSince,
    newSkillsPerPeriod,
    phasesIn,
    RANGES,
    rangeStart,
    changeSince,
    schoolYearAt,
    skillSeries,
    skills,
    thisMonth,
    timeTicks,
    topSkills,
    valueAt,
    yDomain,
    yearOf,
    yTicks
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

describe('the charts at any date', () => {
    it.each([2023, 2024.5, 2026.9, 2027, 2030, 2099])(
        'draws without NaN, Infinity or gaps in the text at %s',
        (now) => {
            for (const lang of ['en', 'fr'] as const) {
                const html = pathChart(lang, PROJECTS, now) + numbers(lang, PROJECTS, now);
                expect(html).not.toMatch(/NaN|Infinity|undefined|\{[a-z]+\}/);
            }
        }
    );

    it('draws with no projects at all', () => {
        expect(pathChart('en', [], 2026.5) + numbers('en', [], 2026.5)).not.toMatch(/NaN|Infinity|undefined/);
    });
});

const TODAY = thisMonth(new Date('2026-10-14'));

/** The headline of the chart for a range, as the page prints it. */
const headline = (lang: 'en' | 'fr', points: ReturnType<typeof skillSeries>, id: string) => {
    const r = RANGES.find((x) => x.id === id)!;
    const { text, over } = changeText(lang, r, points, rangeStart(r, points, TODAY));
    return `${text} ${over}`; // what a screen reader says: the shown change, then its range
};
const range = (id: string) => RANGES.find((r) => r.id === id)!;

describe('the ranges, as on a price chart', () => {
    it('go from a month to everything, each button naming its own range', () => {
        expect(RANGES.map((r) => r.label)).toEqual(['1M', '6M', '1Y', 'Max']);
        expect(new Set(RANGES.map((r) => r.id)).size).toBe(RANGES.length);
        expect(RANGES[RANGES.length - 1].months).toBeNull();
    });

    it('start that many months back, or at the first step for Max', () => {
        const points = skillSeries(PROJECTS, TODAY);
        expect(rangeStart(range('1y'), points, TODAY)).toBeCloseTo(TODAY - 1);
        expect(rangeStart(range('6m'), points, TODAY)).toBeCloseTo(TODAY - 0.5);
        expect(rangeStart(range('max'), points, TODAY)).toBe(points[0].t);
    });
});

describe('the change over a range (the headline of the path chart)', () => {
    const points = skillSeries(PROJECTS, TODAY);
    const since = (id: string) => changeSince(points, rangeStart(range(id), points, TODAY));

    it('is the skills gained since the range began, with a percentage of what there was', () => {
        const total = last(points);
        for (const id of ['1m', '6m', '1y']) {
            const { delta, pct } = since(id);
            const base = total - delta;
            expect(delta).toBeGreaterThanOrEqual(0);
            if (base > 0) expect(pct).toBe(Math.round((delta / base) * 100));
        }
        expect(since('1y').delta).toBe(last(points) - valueAt(points, TODAY - 1));
    });

    it('differs from one range to the next (a longer range gains at least as much)', () => {
        const deltas = RANGES.map((r) => since(r.id).delta);
        expect(deltas).toEqual([...deltas].sort((a, b) => a - b)); // eslint-disable-line -- test-only copy
        expect(new Set(deltas).size).toBeGreaterThan(1);
    });

    it('has no percentage when the range starts from nothing (Max)', () => {
        expect(since('max').pct).toBeNull();
        expect(since('max').delta).toBe(last(points));
    });

    it('reads as a sentence in both languages', () => {
        expect(headline('en', points, '1y')).toMatch(/^▲ \+\d+ \(\d+ %\) past 12 months$/);
        expect(headline('en', points, '6m')).toMatch(/past 6 months$/);
        expect(headline('en', points, '1m')).toMatch(/past month$/);
        expect(headline('en', points, 'max')).toMatch(/^▲ \+\d+ since Jul 2024$/);
        expect(headline('fr', points, '1y')).toMatch(/sur 12 mois$/);
        expect(headline('fr', points, '1m')).toMatch(/sur 1 mois$/);
        expect(headline('fr', points, 'max')).toMatch(/depuis juil\. 2024$/);
    });

    it('shows only the numbers: no words about the range', () => {
        for (const r of RANGES)
            expect(changeText('en', r, points, rangeStart(r, points, TODAY)).text).toMatch(/^[▲ +\d()%]+$/);
    });

    it('says 0, without an arrow, when nothing was gained', () => {
        const later = skillSeries(PROJECTS, 2099);
        const r = range('1y');
        const { text, over, up } = changeText('en', r, later, rangeStart(r, later, 2099));
        expect(text).toBe('0 (0 %)');
        expect(over).toBe('past 12 months');
        expect(up).toBe(false);
    });
});

describe('where the visitor was', () => {
    it('counts Epitech school years from September: before it 0, then 1, 2, 3', () => {
        expect(schoolYearAt(yearOf('2024-07'))).toBe(0);
        expect(schoolYearAt(yearOf('2024-09'))).toBe(1);
        expect(schoolYearAt(yearOf('2025-08'))).toBe(1);
        expect(schoolYearAt(yearOf('2025-09'))).toBe(2);
        expect(schoolYearAt(yearOf('2026-05'))).toBe(2);
        expect(schoolYearAt(TODAY)).toBe(3); // October 2026: Tek 3
    });

    it('covers the whole window with consecutive phases, clipped to it', () => {
        const points = skillSeries(PROJECTS, TODAY);
        for (const t0 of [points[0].t, TODAY - 1, TODAY - 0.5, TODAY - 1 / 12]) {
            const phases = phasesIn(t0, TODAY);
            expect(phases[0].from).toBeCloseTo(t0);
            expect(phases[phases.length - 1].to).toBeCloseTo(TODAY);
            phases.slice(1).forEach((p, i) => expect(p.from).toBeCloseTo(phases[i].to));
        }
        expect(phasesIn(points[0].t, TODAY).map((p) => p.year)).toEqual([0, 1, 2, 3]);
    });

    it('names a phase the way the chart prints it', () => {
        expect(phaseLabel('en', 2, 2025)).toBe('Tek 2 · 2025–26');
        expect(phaseLabel('en', 2, 2025, true)).toBe('Tek 2');
        expect(phaseLabel('fr', 0, 0)).toBe('Avant Epitech');
    });
});

describe('the axes of the path chart', () => {
    it('puts month ticks inside the window, in order, with January always on the grid', () => {
        for (const [t0, now] of [
            [2024.5, TODAY],
            [TODAY - 1, TODAY],
            [TODAY - 0.5, TODAY],
            [TODAY - 1 / 12, TODAY]
        ]) {
            const ticks = timeTicks(t0, now);
            expect(ticks.length).toBeGreaterThan(0);
            ticks.forEach((tk, i) => {
                expect(tk.t).toBeGreaterThanOrEqual(t0 - 1e-6);
                expect(tk.t).toBeLessThanOrEqual(now + 1e-6);
                if (i) expect(tk.t).toBeGreaterThan(ticks[i - 1].t);
            });
            expect(ticks.length).toBeLessThanOrEqual(13);
        }
        expect(timeTicks(2024.5, TODAY).some((tk) => tk.month === 0)).toBe(true);
    });

    it('ticks every month on a short window and spreads out on a long one', () => {
        expect(timeTicks(TODAY - 0.5, TODAY).length).toBeGreaterThanOrEqual(6);
        expect(timeTicks(2024.5, TODAY).length).toBeLessThan(12);
    });

    it('starts the height at nothing for Max and zooms on the change for the other ranges', () => {
        const points = skillSeries(PROJECTS, TODAY);
        expect(yDomain(points, points[0].t).lo).toBe(0);
        const year = yDomain(points, TODAY - 1);
        expect(year.lo).toBeGreaterThan(0);
        expect(year.lo).toBeLessThan(valueAt(points, TODAY - 1));
        expect(year.hi).toBeGreaterThan(last(points));
        const flat = yDomain(skillSeries(PROJECTS, 2099), 2099 - 1);
        expect(flat.hi - flat.lo).toBeGreaterThan(0); // a window where nothing changed still has a height
    });

    it('draws a handful of round gridlines inside the height', () => {
        for (const [lo, hi] of [
            [0, 62.6],
            [15, 60],
            [58, 62],
            [0, 1.2]
        ]) {
            const ticks = yTicks(lo, hi);
            expect(ticks.length).toBeGreaterThan(0);
            expect(ticks.length).toBeLessThanOrEqual(7);
            expect(ticks.every((v) => v >= lo && v <= hi)).toBe(true);
        }
    });
});

describe('checkpoint names on the plot', () => {
    it('stay inside the picture when a checkpoint sits at the start of a range', () => {
        const points = skillSeries(PROJECTS, TODAY);
        const month = pathSvg('en', points, TODAY - 1 / 12, TODAY); // the Issanka checkpoint is dated September 2026
        expect(month).toMatch(/<text class="start"[^>]*>AI developer, Issanka<\/text>/);
        expect(pathSvg('en', points, points[0].t, TODAY)).not.toContain('class="start"'); // nothing sticks out on Max
    });
});
