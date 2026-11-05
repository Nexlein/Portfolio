import { describe, expect, it } from 'vitest';
import { CHECKPOINTS, EXPERIENCES } from '@/data/profile';
import { thisMonth, yearOf } from '@/core/time';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { skillsOf } from '@/data/skills';
import { changeText, numbers, pathChart, pathSvg, phaseLabel } from './render';
import { schoolYear } from './series';
import {
    distinctSkills,
    EPITECH_START,
    domainAxes,
    languageBuckets,
    languageOf,
    learnedSince,
    newSkillsPerPeriod,
    periodsIn,
    phasesIn,
    RANGES,
    rangeStart,
    changeSince,
    skillSeries,
    spelling,
    timeTicks,
    topSkills,
    valueAt,
    yDomain,
    yTicks
} from './data';

/** The skills known at the end of a series. */
const last = (points: ReturnType<typeof skillSeries>) => points[points.length - 1].v;

/** A project with only what the numbers read: a month and some tags. */
const project = (id: string, date: string, tags: string[]): ProjectEntry => ({ ...PROJECTS[0], id, date, tags });

describe('spelling', () => {
    it('writes a skill as the data does', () => {
        const name = spelling([{ ...PROJECTS[0], tags: ['FastAPI', 'PostgreSQL'] }]);
        expect(name('fastapi')).toBe('FastAPI');
        expect(name('postgresql')).toBe('PostgreSQL');
    });

    it('also knows the skills of jobs and checkpoints', () => {
        expect(spelling([])('google cloud')).toBe('Google Cloud');
    });

    it('leaves an unknown skill as it is', () => {
        expect(spelling([])('no such skill')).toBe('no such skill');
    });
});

/** What the path chart says ("58 skills", "+37 in 12 months"), recomputed the plain way for the tests to compare with. */
const known = (t: number) => {
    const all: [number, string[]][] = [
        ...PROJECTS.map((p): [number, string[]] => [yearOf(p.date), skillsOf(p.tags)]),
        ...CHECKPOINTS.map((c): [number, string[]] => [
            yearOf(c.date),
            skillsOf([...(c.skills ?? []), ...(EXPERIENCES.find((e) => e.id === c.id)?.tags ?? [])])
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
        expect(values).toEqual(values.toSorted((a, b) => a - b));
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

describe('checkpoints on the series', () => {
    it.each(CHECKPOINTS)('$id names its month, even when a project started then too', (c) => {
        const point = skillSeries(PROJECTS, yearOf('2099-01')).find((p) => p.t === yearOf(c.date));
        expect(point?.m?.checkpoint?.id).toBe(c.id);
    });
});

const usedBy = (tag: string, n: number) => Array.from({ length: n }, () => ({ ...PROJECTS[0], tags: [tag] }));
const inPeriod = (year: ProjectEntry['year']) => ({ ...PROJECTS[0], year });
const sixMonthsTo = (time: number) => pathSvg('en', skillSeries(PROJECTS, time), time - 6 / 12, time);

describe('group counts', () => {
    it('gives every skill to the period that first used it, once', () => {
        expect(newSkillsPerPeriod(PROJECTS).reduce((a, b) => a + b, 0)).toBe(distinctSkills(PROJECTS));
    });

    it('credits a skill to its earliest project, not to the period listed first', () => {
        const earlier: ProjectEntry = { ...PROJECTS[0], tags: ['Zig'], year: 'Tek3', date: '2026-01' };
        const later: ProjectEntry = { ...PROJECTS[0], tags: ['Zig'], year: 'Personal', date: '2026-06' };
        expect(periodsIn([earlier, later])).toEqual(['Personal', 'Tek3']);
        expect(newSkillsPerPeriod([earlier, later])).toEqual([0, 1]);
    });

    it('keeps every skill tied with the last one shown', () => {
        const projects = [...usedBy('A', 3), ...usedBy('B', 2), ...usedBy('C', 2), ...usedBy('D', 1)];
        expect(topSkills(projects, 2).map(([s]) => s)).toEqual(['a', 'b', 'c']);
    });

    it('ranks the most used skills first', () => {
        const top = topSkills(PROJECTS);
        const uses = top.map(([, n]) => n);
        expect(uses).toEqual(uses.toSorted((a, b) => b - a));
        expect(top.length).toBeGreaterThanOrEqual(7);
    });

    it('names the main language of a project, C/C++ as C++, and infrastructure when there is none', () => {
        expect(languageOf(project('a', '2026-01', ['Jenkins', 'C/C++']))).toBe('C++');
        expect(languageOf(project('b', '2026-01', ['Ansible', 'Vagrant']))).toBe('infra');
    });

    it('buckets every project exactly once', () => {
        const { keys, bucket } = languageBuckets(PROJECTS);
        for (const p of PROJECTS) expect(keys).toContain(bucket(p));
    });

    it('lists the periods oldest first, and every project falls in one', () => {
        expect(periodsIn([inPeriod('Tek3'), inPeriod('Tek1'), inPeriod('Tek2'), inPeriod('Personal')])).toEqual([
            'Tek1',
            'Tek2',
            'Personal',
            'Tek3'
        ]);
        for (const p of PROJECTS) expect(periodsIn(PROJECTS)).toContain(p.year);
    });

    it('counts every project in one domain axis', () => {
        const { counts } = domainAxes(PROJECTS);
        expect(counts.reduce((a, b) => a + b, 0)).toBe(PROJECTS.length);
    });
});

describe('labels in French', () => {
    it('breaks a long column label onto two lines, and keeps a short one on one', () => {
        expect(numbers('fr', PROJECTS, TODAY)).toMatch(/<tspan[^>]*>1re<\/tspan><tspan[^>]*>année<\/tspan>/);
        expect(numbers('en', PROJECTS, TODAY)).not.toContain('<tspan');
    });

    it('gives the path tooltip the school years in the page language', () => {
        expect(pathChart('fr', PROJECTS, TODAY)).toContain('"years":["1re année","2e année","3e année"');
        expect(pathChart('en', PROJECTS, TODAY)).toContain('"years":["year 1","year 2","year 3"');
    });
});

describe('the charts at any date', () => {
    it.each([2023, 2024.5, 2026.9, 2027, 2030, 2099])(
        'draws without NaN, Infinity or gaps in the text at %s',
        (now) => {
            for (const lang of ['en', 'fr'] as const) {
                const html = pathChart(lang, PROJECTS, now) + numbers(lang, PROJECTS, now);
                // The crosshair's data carries its own templates ("{n} skills"): checked on its own
                const json = /<script type="application\/json" class="path-data">(.*?)<\/script>/s.exec(html)![1];
                expect(html.replace(json, '')).not.toMatch(/NaN|Infinity|undefined|\{[a-z]+\}/);
                expect(json).not.toMatch(/null|undefined/); // NaN and Infinity turn into null in JSON
                expect(Object.keys(JSON.parse(json).ranges)).toEqual(['1m', '6m', '1y', 'max']);
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
        expect(RANGES.map((r) => r.id)).toEqual(['1m', '6m', '1y', 'max']);
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
        expect(deltas).toEqual(deltas.toSorted((a, b) => a - b));
        expect(new Set(deltas).size).toBeGreaterThan(1);
    });

    it('has no percentage when the range starts from nothing (Max)', () => {
        expect(since('max').pct).toBeNull();
        expect(since('max').delta).toBe(last(points));
    });

    it('reads as a sentence in both languages', () => {
        expect(headline('en', points, '1y')).toMatch(/^▲ \+\d+ \(\d+%\) past 12 months$/);
        expect(headline('en', points, '6m')).toMatch(/past 6 months$/);
        expect(headline('en', points, '1m')).toMatch(/past month$/);
        expect(headline('en', points, 'max')).toMatch(/^▲ \+\d+ since [A-Z][a-z]{2} \d{4}$/);
        expect(headline('fr', points, '1y')).toMatch(/sur 12 mois$/);
        expect(headline('fr', points, '1m')).toMatch(/sur 1 mois$/);
        expect(headline('fr', points, '1y')).toMatch(/\(\d+\u00a0%\)/);
        expect(headline('fr', points, 'max')).toMatch(/depuis \S+ \d{4}$/);
    });

    it('shows only the numbers: no words about the range', () => {
        for (const r of RANGES)
            expect(changeText('en', r, points, rangeStart(r, points, TODAY)).text).toMatch(/^[▲ +\d()%]+$/);
    });

    it('says 0, without an arrow, when nothing was gained', () => {
        const later = skillSeries(PROJECTS, 2099);
        const r = range('1y');
        const { text, over, up } = changeText('en', r, later, rangeStart(r, later, 2099));
        expect(text).toBe('0 (0%)');
        expect(over).toBe('past 12 months');
        expect(up).toBe(false);
    });
});

describe('where the visitor was', () => {
    it('counts Epitech school years from September: before it 0, then 1, 2, 3', () => {
        expect(schoolYear(yearOf('2024-07'), EPITECH_START)).toBe(0);
        expect(schoolYear(yearOf('2024-09'), EPITECH_START)).toBe(1);
        expect(schoolYear(yearOf('2025-08'), EPITECH_START)).toBe(1);
        expect(schoolYear(yearOf('2025-09'), EPITECH_START)).toBe(2);
        expect(schoolYear(yearOf('2026-05'), EPITECH_START)).toBe(2);
        expect(schoolYear(TODAY, EPITECH_START)).toBe(3); // October 2026: year 3
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
        expect(phaseLabel('en', 2, 2025)).toBe('year 2 · 2025-26');
        expect(phaseLabel('en', 2, 2025, true)).toBe('year 2');
        expect(phaseLabel('fr', 1, 2024, true)).toBe('1re année');
        expect(phaseLabel('fr', 3, 2026)).toBe('3e année · 2026-27');
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
        // The 6-month window zooms in; a longer one may reach back far enough to start at 0 again
        const half = yDomain(points, TODAY - 0.5);
        expect(half.lo).toBeGreaterThan(0);
        expect(half.lo).toBeLessThan(valueAt(points, TODAY - 0.5));
        expect(half.hi).toBeGreaterThan(last(points));
        const year = yDomain(points, TODAY - 1);
        expect(year.lo).toBeGreaterThanOrEqual(0);
        expect(year.lo).toBeLessThanOrEqual(valueAt(points, TODAY - 1));
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

describe('the charts for a screen reader', () => {
    it('say the values of the language columns and the heat map, not just their title', () => {
        const html = numbers('en', PROJECTS, TODAY);
        const languages = /class="columns"[^>]*aria-label="([^"]+)"/.exec(html)![1];
        const heat = /class="heat"[^>]*aria-label="([^"]+)"/.exec(html)![1];
        expect(languages).toMatch(/: \S+ \d/);
        expect(heat).toMatch(/: \S+.* \d/);
    });
});

describe('checkpoint names on the plot', () => {
    it('never share a row when a name starting at the left edge runs into the next one', () => {
        for (const date of CHECKPOINTS.map((c) => yearOf(c.date) + 5 / 12)) {
            const rows = new Map<string, { left: number; right: number }[]>();
            for (const m of sixMonthsTo(date).matchAll(
                /<text class="(start|end|)" x="([\d.]+)" y="([\d.]+)">([^<]+)</g
            )) {
                const [, anchor, x, y, label] = m;
                const width = (label.length * 3.3 + 8) * 2;
                const left =
                    anchor === 'start' ? Number(x) : anchor === 'end' ? Number(x) - width : Number(x) - width / 2;
                const row = rows.get(y) ?? [];
                for (const other of row) expect(left >= other.right || left + width <= other.left, label).toBe(true);
                row.push({ left, right: left + width });
                rows.set(y, row);
            }
        }
    });

    it('stay inside the picture when a checkpoint sits at the start of a range', () => {
        const latest = CHECKPOINTS[CHECKPOINTS.length - 1];
        const from = yearOf(latest.date),
            now = from + 1 / 12;
        const points = skillSeries(PROJECTS, now);
        expect(pathSvg('en', points, from, now)).toMatch(
            new RegExp(`<text class="start"[^>]*>${latest.label.en}</text>`)
        );
        expect(pathSvg('en', points, points[0].t, now)).not.toContain('class="start"'); // nothing sticks out on Max
    });
});
