import { describe, expect, it } from 'vitest';
import type { Stage } from './stage';
import { valueIteration } from './value-iteration';

/** A stage with a recording context, in reduced-motion mode: the simulation settles and draws once. */
function run(width: number, height: number) {
    const arrows: { x: number; y: number; angle: number }[] = [];
    let at = { x: 0, y: 0 };
    const ctx = {
        save() {},
        restore() {},
        translate: (x: number, y: number) => (at = { x, y }),
        rotate: (angle: number) => arrows.push({ ...at, angle }),
        clearRect() {},
        fillRect() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
        arc() {},
        fill() {}
    } as unknown as CanvasRenderingContext2D;
    const stage: Stage = {
        ctx,
        colors: { line: '#000', cold: '#000', signal: '#000' },
        width,
        height,
        pointer: () => null,
        wander: () => ({ x: 0, y: 0 }),
        onClick: () => {},
        onResize: () => {},
        dispose: () => {},
        loop: (frame) => frame(0),
        reduced: true
    };
    valueIteration(stage);
    return arrows;
}

describe('valueIteration', () => {
    it('points most arrows toward the reward', () => {
        const width = 600,
            height = 400;
        const goal = { x: width * 0.7, y: height * 0.35 };
        const arrows = run(width, height);
        expect(arrows.length).toBeGreaterThan(100);

        const toward = arrows.filter((a) => {
            const dx = goal.x - a.x,
                dy = goal.y - a.y;
            return Math.cos(a.angle) * dx + Math.sin(a.angle) * dy > 0;
        });
        expect(toward.length / arrows.length).toBeGreaterThan(0.9);
    });
});
