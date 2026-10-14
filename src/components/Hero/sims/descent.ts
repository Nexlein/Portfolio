/**
 * Gradient descent with momentum on a bumpy loss landscape. The cursor is the minimum; a click adds a hill.
 */
import type { Point, Stage } from './stage';

const CELL = 26;
const OPTIMISERS = 110;
const LEVELS = 8; // brightness steps of the dot grid

export function descent(s: Stage): void {
    const { ctx, colors } = s;
    const hills = Array.from({ length: 7 }, () => ({
        x: Math.random() * s.width,
        y: Math.random() * s.height,
        h: 0.5 + Math.random() * 0.7,
        r: 90 + Math.random() * 90
    }));
    let fieldDirty = true;
    s.onClick((p) => {
        hills.push({ ...p, h: 0.9, r: 110 });
        if (hills.length > 14) hills.shift();
        fieldDirty = true;
    });

    let goal: Point = { x: s.width / 2, y: s.height / 2 };
    const hillsAt = (x: number, y: number) => {
        let v = 0;
        for (const k of hills) v += k.h * Math.exp(-((x - k.x) ** 2 + (y - k.y) ** 2) / (2 * k.r * k.r));
        return v;
    };
    let bowlWidth = 1; // the stage's width, read once a frame (the getter asks the DOM, and this runs thousands of times)
    const bowlAt = (x: number, y: number) => ((x - goal.x) ** 2 + (y - goal.y) ** 2) / (bowlWidth * bowlWidth * 0.18);
    const loss = (x: number, y: number) => bowlAt(x, y) + hillsAt(x, y);

    // The hills only change on a click or a resize: their part of the grid's loss is kept, only the bowl follows the goal
    let field = new Float32Array(0),
        fieldSize = '';
    const refreshField = (W: number, H: number) => {
        const size = `${W}x${H}`;
        if (!fieldDirty && size === fieldSize) return;
        fieldDirty = false;
        fieldSize = size;
        const values: number[] = [];
        for (let y = CELL / 2; y < H; y += CELL) for (let x = CELL / 2; x < W; x += CELL) values.push(hillsAt(x, y));
        field = Float32Array.from(values);
    };
    const spawn = () => ({ x: Math.random() * s.width, y: Math.random() * s.height, vx: 0, vy: 0, life: 0 });
    const balls = Array.from({ length: OPTIMISERS }, spawn);
    const trails = balls.map(() => [] as Point[]);

    let t = 0;
    s.loop(() => {
        goal = s.pointer() ?? s.wander((t += 0.003));
        const W = s.width,
            H = s.height;
        bowlWidth = W;
        ctx.clearRect(0, 0, W, H);
        // The landscape: a dot grid, brighter where the loss is low (one fill per brightness level, not per dot)
        ctx.fillStyle = colors.cold;
        const dots = Array.from({ length: LEVELS }, () => new Path2D());
        refreshField(W, H);
        let cell = 0;
        for (let y = CELL / 2; y < H; y += CELL)
            for (let x = CELL / 2; x < W; x += CELL) {
                const a = Math.max(0.14, 0.8 - (bowlAt(x, y) + field[cell++]) * 0.55);
                dots[Math.round(((a - 0.14) / 0.66) * (LEVELS - 1))].rect(x - 1, y - 1, 2, 2);
            }
        dots.forEach((path, k) => {
            ctx.globalAlpha = 0.14 + 0.66 * (k / (LEVELS - 1));
            ctx.fill(path);
        });
        // Optimisers: momentum SGD, each leaving a short trail (all trails in one stroke)
        ctx.strokeStyle = colors.signal;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        balls.forEach((p, i) => {
            const gx = (loss(p.x + 1, p.y) - loss(p.x - 1, p.y)) / 2,
                gy = (loss(p.x, p.y + 1) - loss(p.x, p.y - 1)) / 2;
            p.vx = p.vx * 0.9 - gx * 160;
            p.vy = p.vy * 0.9 - gy * 160;
            p.x += p.vx;
            p.y += p.vy;
            p.life++;
            trails[i].push({ x: p.x, y: p.y });
            if (trails[i].length > 30) trails[i].shift();
            const stuck = p.life > 60 && Math.hypot(p.vx, p.vy) < 0.05,
                out = p.x < -20 || p.y < -20 || p.x > W + 20 || p.y > H + 20;
            if (p.life > 420 || stuck || out) {
                Object.assign(p, spawn());
                trails[i] = [];
            }
            trails[i].forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
}
