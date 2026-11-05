import { describe, expect, it } from 'vitest';
import { CARD } from './graph';
import { port, scatterNeurons, stepBodies, widestGap, wireNeurons, type Body } from './scene';

const body = (over: Partial<Body> = {}): Body => ({
    x: 0,
    y: 0,
    star: { x: 0, y: 0 },
    hold: false,
    ox: 0,
    oy: 0,
    vx: 0,
    vy: 0,
    ...over
});

describe('port', () => {
    it('stops at the edge of the card', () => {
        expect(port({ x: 0, y: 0 }, { x: 1000, y: 0 })).toEqual({ x: CARD.w / 2, y: 0 });
        expect(port({ x: 0, y: 0 }, { x: 0, y: 1000 })).toEqual({ x: 0, y: CARD.h / 2 });
    });

    it('stays on the target when it is inside the card', () => {
        expect(port({ x: 0, y: 0 }, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
    });
});

const angleGap = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

describe('widestGap', () => {
    it('finds the angle opposite a single taken one', () => {
        expect(
            angleGap(
                widestGap([0], () => true),
                Math.PI
            )
        ).toBeLessThan(0.14);
    });

    it('skips the angles that are not clear', () => {
        expect(Math.cos(widestGap([Math.PI], (a) => Math.cos(a) >= 0))).toBeGreaterThanOrEqual(0);
    });

    it('settles for the widest gap when nothing is clear', () => {
        expect(
            angleGap(
                widestGap([0], () => false),
                Math.PI
            )
        ).toBeLessThan(0.14);
    });
});

describe('scatterNeurons', () => {
    const centre = { x: 640, y: 380 };
    const fit = { rx: 400, ry: 280 };
    const cards = [
        { x: 300, y: 200 },
        { x: 900, y: 500 }
    ];

    it('gives the same picture on every visit', () => {
        expect(scatterNeurons(centre, fit, cards)).toEqual(scatterNeurons(centre, fit, cards));
    });

    it('keeps neurons off the cards and apart from each other', () => {
        const spots = scatterNeurons(centre, fit, cards);
        expect(spots.length).toBeGreaterThan(20);
        for (const [i, n] of spots.entries()) {
            for (const c of cards)
                expect(Math.abs(n.x - c.x) >= CARD.w / 2 || Math.abs(n.y - c.y) >= CARD.h / 2).toBe(true);
            for (const m of spots.slice(i + 1)) expect(Math.hypot(n.x - m.x, n.y - m.y)).toBeGreaterThanOrEqual(34);
        }
    });
});

describe('wireNeurons', () => {
    it('joins each neuron to its nearest ones, once per pair', () => {
        const spots = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 20, y: 0 }
        ];
        const pairs = wireNeurons(spots, []).map(({ from, to }) => [from, to].join('-'));
        expect(pairs).toEqual(['0-1', '0-2', '1-2']);
    });

    it('joins a neuron to a card close by, and leaves far ones alone', () => {
        const near = { x: 100, y: 0 };
        const far = { x: 1000, y: 0 };
        expect(wireNeurons([{ x: 0, y: 0 }], [far, near])).toEqual([{ from: 0, to: near }]);
    });
});

describe('stepBodies', () => {
    it('pulls a body back towards its resting place', () => {
        const away = body({ ox: 500 });
        for (let i = 0; i < 400; i++) stepBodies([away], [], [], null, 30, 0);
        expect(Math.abs(away.ox)).toBeLessThan(500);
    });

    it('leaves a held body exactly where it is', () => {
        const held = body({ hold: true, ox: 40, vx: 9 });
        stepBodies([held], [], [], null, 30, 1);
        expect(held.ox).toBe(40);
        expect(held.vx).toBe(0);
    });

    it('moves linked bodies towards each other, and the cursor draws the one it attends to', () => {
        const a = body({ star: { x: 0, y: 0 } });
        const b = body({ star: { x: 0, y: 0 }, ox: 100 });
        stepBodies([a, b], [{ a, b }], [], null, 30, 0);
        const alone = body({ star: { x: 0, y: 0 } });
        stepBodies([alone], [], [], null, 30, 0);
        expect(a.vx).toBeGreaterThan(alone.vx);

        const drawn = body();
        stepBodies([drawn], [], [{ c: drawn, w: 1 }], { x: 100, y: 0 }, 30, 0);
        expect(drawn.vx).toBeGreaterThan(alone.vx);
    });
});
