/**
 * Numbers behind the charts, computed from the data only (projects.ts, profile.ts): nothing is typed in by hand.
 * Pure and Node-safe (relative imports): the build renders the charts as static SVG, the browser reuses the same
 * functions for interactions.
 */
import { CHECKPOINTS, EXPERIENCES, type Checkpoint } from '../../data/profile.ts';
import type { ProjectEntry } from '../../data/projects.ts';
import { periodOf, type Period } from '../NeuralMap/graph.ts';
import { schoolYear, valueAt } from './series.ts';

export { valueAt, yDomain } from './series.ts';

/** 'YYYY-MM' -> fractional year (2026-04 -> 2026.25). */
export const yearOf = (month: string) => Number(month.slice(0, 4)) + (Number(month.slice(5, 7)) - 1) / 12;

/** Today, as a fractional year at the start of the current month. */
export const thisMonth = (now = new Date()) => now.getFullYear() + now.getMonth() / 12;

/** Normalised skill names: lowercase, 'C/C++' split, RL aliases merged. */
export function skills(tags: string[]): string[] {
    return tags.flatMap((raw) =>
        raw
            .toLowerCase()
            .split('/')
            .map((s) => s.trim())
            .map((s) => (s === 'rl' ? 'reinforcement learning' : s))
            .filter(Boolean)
    );
}

/** Display form of a normalised skill. */
export const prettySkill = (s: string) => (s.length <= 3 ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1));

interface Milestone {
    t: number;
    /** Checkpoint id, or project id. */
    id: string;
    checkpoint?: Checkpoint;
    project?: ProjectEntry;
    adds: string[];
}

const tagsOf = (id: string) => EXPERIENCES.find((e) => e.id === id)?.tags ?? [];

/** Every dated step, oldest first: checkpoints (with their skills) and projects (with their tags). */
function milestones(projects: ProjectEntry[]): Milestone[] {
    const all: Milestone[] = [
        ...CHECKPOINTS.map((c) => ({
            t: yearOf(c.date),
            id: c.id,
            checkpoint: c,
            adds: skills([...(c.skills ?? []), ...tagsOf(c.id)])
        })),
        ...projects.map((p) => ({ t: yearOf(p.date), id: p.id, project: p, adds: skills(p.tags) }))
    ];
    // Stable insertion by date (the codebase lint bans Array#sort; ES2020 has no toSorted)
    const out: Milestone[] = [];
    for (const m of all) {
        let i = out.length;
        while (i > 0 && out[i - 1].t > m.t) i--;
        out.splice(i, 0, m);
    }
    return out;
}

export interface Point {
    t: number;
    /** Distinct skills known at t. */
    v: number;
    /** What happened (null for the start and end points). */
    m: Milestone | null;
}

/** Cumulative distinct skills, from two months before the first milestone to `now`. */
export function skillSeries(projects: ProjectEntry[], now: number): Point[] {
    const steps = milestones(projects).filter((m) => m.t <= now);
    const known = new Set<string>();
    const points: Point[] = [{ t: (steps[0]?.t ?? now) - 2 / 12, v: 0, m: null }];
    for (const m of steps) {
        m.adds.forEach((s) => known.add(s));
        // Several steps in the same month make one point (the last one names it), so the curve never jumps
        if (points[points.length - 1].t === m.t) points.pop();
        points.push({ t: m.t, v: known.size, m });
    }
    points.push({ t: now, v: known.size, m: null });
    return points;
}

/** The ranges of the path chart, as on a price chart. Steps are whole months, so there is no 1D or 1W. */
export interface Range {
    /** Also names the button's text in the dictionaries (home.path.ranges.<id>). */
    id: string;
    /** Months back from today; null is everything (from the first step). */
    months: number | null;
}

export const RANGES: Range[] = [
    { id: '1m', months: 1 },
    { id: '6m', months: 6 },
    { id: '1y', months: 12 },
    { id: 'max', months: null }
];

/** Where a range starts. */
export const rangeStart = (range: Range, points: Point[], now: number) =>
    range.months === null ? points[0].t : now - range.months / 12;

/** How the toolbox changed from `t0` to the end: skills gained, and the percentage when there was something to start from. */
export function changeSince(points: Point[], t0: number): { delta: number; pct: number | null } {
    const base = valueAt(points, t0 + 1e-9); // a step in the very month the range starts is already in the base
    const delta = points[points.length - 1].v - base;
    return { delta, pct: base > 0 ? Math.round((delta / base) * 100) : null };
}

/** Epitech's school years run September to August, counted from the month the first one started (the 'epitech' checkpoint). */
export const EPITECH_START = yearOf(CHECKPOINTS.find((c) => c.id === 'epitech')!.date);

/** The school year a time falls in: 0 before Epitech, then 1, 2, 3... */
export const schoolYearAt = (time: number) => schoolYear(time, EPITECH_START);

export interface Phase {
    /** 0 is the time before Epitech, then the school years 1, 2, 3... */
    year: number;
    /** The window's part this phase covers. */
    from: number;
    to: number;
    /** Calendar year the school year starts in (2025 for 2025-26); 0 before Epitech. */
    start: number;
}

/** The phases of life a window [t0, now] touches, oldest first, each clipped to the window. */
export function phasesIn(t0: number, now: number): Phase[] {
    const out: Phase[] = [];
    if (t0 < EPITECH_START) out.push({ year: 0, from: t0, to: Math.min(now, EPITECH_START), start: 0 });
    for (let n = 1; EPITECH_START + n - 1 < now; n++) {
        const from = EPITECH_START + n - 1,
            to = EPITECH_START + n;
        if (to > t0)
            out.push({ year: n, from: Math.max(from, t0), to: Math.min(to, now), start: Math.floor(from + 1e-9) });
    }
    return out;
}

export interface Tick {
    t: number;
    /** 0 (January) to 11. */
    month: number;
    year: number;
}

/** Month ticks for the x axis: every month on a short window, then every 2, 3 or 6 months, always counting from January. */
export function timeTicks(t0: number, now: number): Tick[] {
    const span = (now - t0) * 12;
    const step = span <= 8 ? 1 : span <= 16 ? 2 : span <= 36 ? 3 : 6;
    const out: Tick[] = [];
    for (let k = Math.ceil(t0 * 12 - 1e-6); k <= Math.floor(now * 12 + 1e-6); k++)
        if ((k % 12) % step === 0) out.push({ t: k / 12, month: k % 12, year: Math.floor(k / 12) });
    return out;
}

/** Gridline values inside [lo, hi]: a round step giving about five lines. */
export function yTicks(lo: number, hi: number): number[] {
    const step = [1, 2, 5, 10, 20, 50, 100].find((s) => (hi - lo) / s <= 5) ?? 100;
    const out: number[] = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
    return out;
}

/** When each skill was first used. */
function firstSeen(projects: ProjectEntry[]): Map<string, number> {
    const seen = new Map<string, number>();
    for (const m of milestones(projects)) for (const s of m.adds) if (!seen.has(s)) seen.set(s, m.t);
    return seen;
}

/** Skills first used in the 12 months before `now`, oldest first. */
export const learnedSince = (projects: ProjectEntry[], now: number) =>
    [...firstSeen(projects)].filter(([, t]) => t > now - 1 && t <= now).map(([s]) => s);

// ── Group counts ────────────────────────────────────────────────────────────

const PERIODS: Period[] = ['Tek1', 'Tek2', 'Personal'];

/** Periods present in the data, in time order. */
export const periodsIn = (projects: ProjectEntry[]) => PERIODS.filter((y) => projects.some((p) => periodOf(p) === y));

const LANGUAGES = new Set(['C', 'C++', 'Python', 'TypeScript', 'JavaScript', 'Rust', 'Go', 'Java', 'C#']);
export const INFRA = 'infra';
export const OTHER = 'other';

/** Main language of a project: its first tag that is a language, else infrastructure / no-code. */
export function languageOf(p: ProjectEntry): string {
    for (const t of p.tags) {
        if (t === 'C/C++') return 'C++';
        if (LANGUAGES.has(t)) return t;
    }
    return INFRA;
}

/** Top 3 languages keep their name; the rest become OTHER; projects without a language are INFRA. */
export function languageBuckets(projects: ProjectEntry[]): { keys: string[]; bucket: (p: ProjectEntry) => string } {
    const tally = new Map<string, number>();
    for (const p of projects)
        if (languageOf(p) !== INFRA) tally.set(languageOf(p), (tally.get(languageOf(p)) ?? 0) + 1);
    const top: string[] = [];
    for (let k = 0; k < 3 && tally.size; k++) {
        const best = [...tally].reduce((a, e) => (e[1] > a[1] ? e : a));
        top.push(best[0]);
        tally.delete(best[0]);
    }
    const keys = [...top, ...(tally.size ? [OTHER] : []), INFRA];
    const bucket = (p: ProjectEntry) =>
        languageOf(p) === INFRA ? INFRA : top.includes(languageOf(p)) ? languageOf(p) : OTHER;
    return { keys, bucket };
}

const DOMAIN_ORDER = ['ai', 'systems', 'architecture', 'graphical', 'devops'];

/** Domains for the radar: up to 7 axes, the rest grouped as OTHER. */
export function domainAxes(projects: ProjectEntry[]): { keys: string[]; counts: number[] } {
    const used = [...new Set(projects.map((p) => p.category as string))];
    const ranked = [...DOMAIN_ORDER.filter((d) => used.includes(d)), ...used.filter((d) => !DOMAIN_ORDER.includes(d))];
    const keys = ranked.length > 7 ? [...ranked.slice(0, 6), OTHER] : ranked;
    const counts = keys.map(
        (d) => projects.filter((p) => (d === OTHER ? !keys.includes(p.category) : p.category === d)).length
    );
    return { keys, counts };
}

/** The most used skills across projects, most frequent first. */
export function topSkills(projects: ProjectEntry[], n = 7): [string, number][] {
    const freq = new Map<string, number>();
    for (const p of projects) for (const s of new Set(skills(p.tags))) freq.set(s, (freq.get(s) ?? 0) + 1);
    const out: [string, number][] = [];
    for (const e of freq) {
        let i = out.length;
        while (i > 0 && out[i - 1][1] < e[1]) i--;
        out.splice(i, 0, e);
    }
    return out.slice(0, n);
}

/** New skills per period: skills seen for the first time in that period's projects. */
export function newSkillsPerPeriod(projects: ProjectEntry[]): number[] {
    const pers = periodsIn(projects);
    const first = new Map<string, Period>();
    for (const y of pers)
        for (const p of projects.filter((q) => periodOf(q) === y))
            for (const s of skills(p.tags)) if (!first.has(s)) first.set(s, y);
    return pers.map((y) => [...first.values()].filter((v) => v === y).length);
}

export const distinctSkills = (projects: ProjectEntry[]) => new Set(projects.flatMap((p) => skills(p.tags))).size;
