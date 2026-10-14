import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Stage } from './stage';
import { valueIteration } from './value-iteration';

/** Records each arrow's tail->tip segment: an arrow is five path calls (moveTo tail, lineTo tip, barb, moveTo tip, barb). */
class RecordingPath {
    static arrows: { x: number; y: number; angle: number }[] = [];
    private calls = 0;
    private tail = { x: 0, y: 0 };
    moveTo(x: number, y: number) {
        if (this.calls++ % 5 === 0) this.tail = { x, y };
    }
    lineTo(x: number, y: number) {
        if (this.calls++ % 5 !== 1) return;
        const { tail } = this;
        RecordingPath.arrows.push({
            x: (tail.x + x) / 2,
            y: (tail.y + y) / 2,
            angle: Math.atan2(y - tail.y, x - tail.x)
        });
    }
}

/** A stage with a recording context, in reduced-motion mode: the simulation settles and draws once. */
function run(width: number, height: number) {
    RecordingPath.arrows = [];
    vi.stubGlobal('Path2D', RecordingPath);
    const ctx = {
        clearRect() {},
        fillRect() {},
        beginPath() {},
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
    return RecordingPath.arrows;
}

describe('valueIteration', () => {
    afterEach(() => vi.unstubAllGlobals());

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

    it('still has a reward after the window turns from landscape to portrait (reduced motion redraws only on resize)', () => {
        RecordingPath.arrows = [];
        vi.stubGlobal('Path2D', RecordingPath);
        const ctx = { clearRect() {}, fillRect() {}, beginPath() {}, stroke() {}, arc() {}, fill() {} };
        const size = { width: 844, height: 390 };
        let draw: ((t: number) => void) | undefined;
        const resizers: (() => void)[] = [];
        const stage = {
            ctx: ctx as unknown as CanvasRenderingContext2D,
            colors: { line: '#000', cold: '#000', signal: '#000' },
            get width() {
                return size.width;
            },
            get height() {
                return size.height;
            },
            pointer: () => null,
            wander: () => ({ x: 0, y: 0 }),
            onClick: () => {},
            onResize: (fn: () => void) => resizers.push(fn),
            dispose: () => {},
            loop: (frame: (t: number) => void) => {
                draw = frame;
                frame(0);
            },
            reduced: true
        } satisfies Stage;
        valueIteration(stage);
        Object.assign(size, { width: 390, height: 844 }); // a phone turned upright
        resizers.forEach((fn) => fn());
        RecordingPath.arrows = [];
        draw!(0);
        expect(RecordingPath.arrows.length).toBeGreaterThan(100);
    });

    it('a click toggles a wall (never on the reward) and the arrows re-plan around it', () => {
        RecordingPath.arrows = [];
        vi.stubGlobal('Path2D', RecordingPath);
        let walls = 0;
        const ctx = {
            clearRect() {},
            fillRect: () => walls++,
            beginPath() {},
            stroke() {},
            arc() {},
            fill() {}
        };
        let click: ((p: { x: number; y: number }) => void) | undefined;
        let draw: ((t: number) => void) | undefined;
        const stage = {
            ctx: ctx as unknown as CanvasRenderingContext2D,
            colors: { line: '#000', cold: '#000', signal: '#000' },
            width: 600,
            height: 400,
            pointer: () => null,
            wander: () => ({ x: 0, y: 0 }),
            onClick: (fn: (p: { x: number; y: number }) => void) => (click = fn),
            onResize: () => {},
            dispose: () => {},
            loop: (frame: (t: number) => void) => {
                draw = frame;
                frame(0);
            },
            reduced: true
        } satisfies Stage;
        valueIteration(stage);
        const drawnWalls = () => {
            walls = 0;
            draw!(0);
            return walls;
        };
        const before = drawnWalls();
        click!({ x: 100, y: 300 }); // a free spot far from the reward: one wall more (or one less, if it was one)
        const after = drawnWalls();
        expect(Math.abs(after - before)).toBe(1);
        click!({ x: 100, y: 300 }); // the same spot again puts it back
        expect(drawnWalls()).toBe(before);
        click!({ x: 600 * 0.7, y: 400 * 0.35 }); // on the reward: nothing happens
        expect(drawnWalls()).toBe(before);
    });
});
