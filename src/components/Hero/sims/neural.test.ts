import { describe, expect, it, vi } from 'vitest';
import type { Stage } from './stage';
import { neural, propagate } from './neural';

describe('propagate', () => {
    it('passes activation to linked neighbours only', () => {
        const next = propagate([1, 0, 0], [{ a: 0, b: 1, weight: 1 }]);
        expect(next[1]).toBeGreaterThan(0);
        expect(next[2]).toBe(0);
    });

    it('lets activation fade, so a pulse dies out', () => {
        let act = [1, 0];
        for (let i = 0; i < 200; i++) act = propagate(act, [{ a: 0, b: 1, weight: 1 }]);
        expect(Math.max(...act)).toBeLessThan(0.001);
    });

    it('weaker links pass less', () => {
        const strong = propagate([1, 0], [{ a: 0, b: 1, weight: 1 }]);
        const weak = propagate([1, 0], [{ a: 0, b: 1, weight: 0.3 }]);
        expect(weak[1]).toBeLessThan(strong[1]);
    });
});

describe('neural', () => {
    it('lights up the neurons around the cursor', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5); // every neuron at the centre, standing still
        const fills: string[] = [];
        const ctx = new Proxy(
            {},
            {
                get: (_, key) => (key === 'fillStyle' ? undefined : () => {}),
                set: (_, key, value) => {
                    if (key === 'fillStyle') fills.push(value as string);
                    return true;
                }
            }
        ) as unknown as CanvasRenderingContext2D;
        const stage: Stage = {
            ctx,
            colors: { line: 'line', cold: 'cold', signal: 'signal' },
            width: 800,
            height: 400,
            pointer: () => ({ x: 400, y: 200 }),
            wander: () => ({ x: 0, y: 0 }),
            onClick: () => {},
            onResize: () => {},
            dispose: () => {},
            loop: (frame) => frame(0),
            reduced: false
        };
        neural(stage);
        expect(fills).toContain('signal');
        vi.restoreAllMocks();
    });

    it('walks neurons back inside when the window shrinks (they used to flip in place, outside)', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9); // every neuron at 90% of the width, drifting right and down
        const xs: number[] = [];
        const ctx = new Proxy(
            {},
            {
                get: (_, key) => (key === 'arc' ? (x: number) => xs.push(x) : () => {}),
                set: () => true
            }
        ) as unknown as CanvasRenderingContext2D;
        const size = { width: 800, height: 400 };
        let frame: ((t: number) => void) | undefined;
        neural({
            ctx,
            colors: { line: 'line', cold: 'cold', signal: 'signal' },
            get width() {
                return size.width;
            },
            get height() {
                return size.height;
            },
            pointer: () => null,
            wander: () => ({ x: 0, y: 0 }),
            onClick: () => {},
            onResize: () => {},
            dispose: () => {},
            loop: (f) => (frame = f),
            reduced: false
        });
        size.width = 100; // the neurons are now far outside
        const meanX = () => {
            const seen = xs.splice(0);
            return seen.reduce((a, b) => a + b, 0) / (seen.length || 1);
        };
        frame!(0);
        const first = meanX();
        for (let t = 1; t < 60; t++) frame!(t);
        xs.length = 0;
        frame!(60);
        expect(meanX()).toBeLessThan(first);
        vi.restoreAllMocks();
    });
});
