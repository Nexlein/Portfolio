import { describe, expect, it } from 'vitest';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { CARD, fitFor, layout, neighbours, periodOf, pickShown, similarity } from './graph';

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
