/**
 * The path chart's geometry and the few rules the browser needs for its crosshair: pure functions of a series of
 * steps, with no data imported. The build computes the series from projects.ts and profile.ts (data.ts) and embeds it
 * in the page, so the browser never downloads the data itself.
 * Relative imports only: rendered from Node.
 */

/** One step of a series: at time `t` (a fractional year), the value `v`. */
export interface Step {
    t: number;
    v: number;
}

/** Value at t (the last step at or before t). */
export const valueAt = (points: Step[], t: number) => points.reduce((v, p) => (p.t <= t ? p.v : v), 0);

/** The values the chart's height covers for a range: from nothing for the full range, else zoomed on what changed. */
export function yDomain(points: Step[], t0: number): { lo: number; hi: number } {
    const total = points[points.length - 1].v,
        base = valueAt(points, t0 + 1e-9);
    if (base === 0) return { lo: 0, hi: total * 1.08 || 1 };
    const span = Math.max(total - base, 2); // a window where nothing changed still gets a visible line
    return { lo: Math.max(0, base - span * 0.25), hi: base + span * 1.08 };
}

/** The school year a time falls in, for school years starting at `start`: 0 before, then 1, 2, 3... */
export const schoolYear = (time: number, start: number) => (time < start ? 0 : Math.floor(time - start + 1e-9) + 1);

/** "Jan 2026" from a fractional year, with the month names of a language. */
export const monthLabel = (time: number, months: readonly string[]) =>
    `${months[Math.min(11, Math.round((time % 1) * 12))]} ${Math.floor(time + 1e-6)}`;

export const PATH = { W: 1080, H: 360, L: 44, R: 60, T: 84, B: 30 };
const smooth = (u: number) => u * u * (3 - 2 * u);

/** Sampled smooth steps between milestones: the line, the hover dot and the tooltip all use these. */
export function pathSamples(
    points: Step[],
    t0: number,
    now: number,
    domain: { lo: number; hi: number }
): [number, number][] {
    const { W, H, L, R, T, B } = PATH;
    const x = (time: number) => L + ((time - t0) / (now - t0)) * (W - L - R);
    const y = (v: number) => H - B - ((v - domain.lo) / (domain.hi - domain.lo || 1)) * (H - T - B);
    const vis = [{ t: t0, v: valueAt(points, t0) }, ...points.filter((p) => p.t > t0)];
    const out: [number, number][] = [];
    vis.forEach((p, i) => {
        if (i === 0) return void out.push([x(p.t), y(p.v)]);
        const a = vis[i - 1];
        for (let k = 1; k <= 14; k++) {
            const u = k / 14;
            out.push([x(a.t + (p.t - a.t) * u), y(a.v + (p.v - a.v) * smooth(u))]);
        }
    });
    return out;
}

/** What the build embeds in the page for the path chart's crosshair and range buttons (one language). */
export interface PathData {
    now: number;
    /** When the first school year started (schoolYear). */
    epitech: number;
    months: string[];
    /** "Before Epitech", "{n} skills". */
    before: string;
    skills: string;
    /** The series; `what` names the step's milestone ('' for the start and end points). */
    points: (Step & { what: string })[];
    /** Per range id: where it starts, and the headline change (`text`, and `over` for screen readers). */
    ranges: Record<string, { t0: number; text: string; over: string; up: boolean }>;
}
