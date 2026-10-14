import { describe, expect, it } from 'vitest';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { CARD, fitFor, layout, mds, neighbours, periodOf, pickShown, similarity, skillSet } from './graph';

/** `n` projects made from the real ones (same skills, other ids), as when the portfolio grows. */
function grown(n: number): ProjectEntry[] {
    const years = ['Tek1', 'Tek2', 'Personal'] as const;
    return Array.from({ length: n }, (_, k) => {
        const p = PROJECTS[k % PROJECTS.length];
        return k < PROJECTS.length ? p : { ...p, id: `${p.id}-${k}`, featured: undefined, year: years[k % 3] };
    });
}

function overlaps(stars: { x: number; y: number }[]): number {
    let n = 0;
    for (let i = 0; i < stars.length; i++)
        for (let j = i + 1; j < stars.length; j++)
            if (Math.abs(stars[i].x - stars[j].x) < CARD.w && Math.abs(stars[i].y - stars[j].y) < CARD.h) n++;
    return n;
}

describe('similarity', () => {
    it('is 1 with itself, symmetric, and between 0 and 1', () => {
        for (const a of PROJECTS) {
            expect(similarity(a, a)).toBe(1);
            for (const b of PROJECTS) {
                expect(similarity(a, b)).toBeCloseTo(similarity(b, a));
                expect(similarity(a, b)).toBeGreaterThanOrEqual(0);
                expect(similarity(a, b)).toBeLessThanOrEqual(1);
            }
        }
    });

    it('finds three neighbours, most similar first', () => {
        const near = neighbours(PROJECTS[0], PROJECTS);
        expect(near).toHaveLength(3);
        expect(near[0].s).toBeGreaterThanOrEqual(near[1].s);
        expect(near.map((n) => n.q)).not.toContain(PROJECTS[0]);
    });
});

describe.each([
    [1440, 846],
    [1280, 760],
    [1920, 1015]
])('layout on a %ix%i board', (W, H) => {
    const fit = fitFor(W, H);
    const inside = (s: { x: number; y: number }) => Math.hypot((s.x - W / 2) / fit.rx, (s.y - H / 2) / fit.ry) <= 1.001;

    it("places today's projects without overlap, inside the ellipse", () => {
        const stars = layout(W, H, fit, PROJECTS);
        expect(overlaps(stars)).toBe(0);
        expect(stars.every(inside)).toBe(true);
    });

    it('still has room when the portfolio reaches 40 projects (24 shown)', () => {
        const { shown } = pickShown(grown(40), 24);
        const stars = layout(W, H, fit, shown);
        expect(overlaps(stars)).toBe(0);
        expect(stars.every(inside)).toBe(true);
    });
});

describe('layout at every window width the map is shown at (900px and up; the board is at least 760px tall)', () => {
    // A board where the ellipse is too tight used to leave a few cards overlapping (up to 25px at 1303x800)
    it("never overlaps today's projects", () => {
        const bad: string[] = [];
        for (let W = 901; W <= 1700; W += 5)
            for (const H of [760, 800, 900, 1000])
                if (overlaps(layout(W, H, fitFor(W, H), PROJECTS))) bad.push(`${W}x${H}`);
        expect(bad).toEqual([]);
    }, 30_000); // 640 layouts, about 1.5 s; coverage instrumentation makes it several times slower

    it('keeps every card on the board', () => {
        for (const [W, H] of [
            [901, 760],
            [1024, 768],
            [1303, 800]
        ])
            for (const s of layout(W, H, fitFor(W, H), PROJECTS)) {
                expect(s.x - CARD.w / 2).toBeGreaterThanOrEqual(-1);
                expect(s.x + CARD.w / 2).toBeLessThanOrEqual(W + 1);
                expect(s.y - CARD.h / 2).toBeGreaterThanOrEqual(-1);
                expect(s.y + CARD.h / 2).toBeLessThanOrEqual(H + 1);
            }
    });
});

describe('small inputs', () => {
    it('lays out zero, one and two projects without NaN', () => {
        for (const n of [0, 1, 2]) {
            const items = PROJECTS.slice(0, n);
            expect(mds(items).flat().every(Number.isFinite)).toBe(true);
            expect(layout(1280, 760, fitFor(1280, 760), items).every((s) => Number.isFinite(s.x + s.y))).toBe(true);
        }
    });

    it('ignores empty skills ("C/" or a blank tag)', () => {
        const odd = { ...PROJECTS[0], tags: ['C/', ' ', 'Net / work'] };
        expect([...skillSet(odd)]).not.toContain('');
    });

    it('finds fewer than three neighbours when the pool is small', () => {
        expect(neighbours(PROJECTS[0], PROJECTS.slice(0, 2))).toHaveLength(1);
        expect(neighbours(PROJECTS[0], [PROJECTS[0]])).toHaveLength(0);
    });
});

describe('pickShown', () => {
    it('shows everything while it fits', () => {
        expect(pickShown(PROJECTS, 24)).toEqual({ shown: expect.any(Array), hidden: [] });
        expect(pickShown(PROJECTS, 24).shown).toHaveLength(PROJECTS.length);
    });

    it('keeps featured projects, then the most recent, when it does not', () => {
        const { shown, hidden } = pickShown(grown(40), 24);
        expect(shown).toHaveLength(24);
        expect(hidden).toHaveLength(16);
        expect(shown.slice(0, 3).every((p) => p.featured)).toBe(true);
        const order = ['Personal', 'Tek2', 'Tek1'];
        const rest = shown.slice(3).map((p) => order.indexOf(periodOf(p)));
        expect(rest).toEqual([...rest].sort((a, b) => a - b)); // eslint-disable-line -- test-only copy
    });
});
