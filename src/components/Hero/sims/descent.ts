/**
 * Gradient descent with momentum on a bumpy loss landscape. The cursor is the minimum; a click adds a hill.
 */
import type { Point, Stage } from './stage';

const CELL = 26;
const OPTIMISERS = 110;

export function descent(s: Stage): void {
    const { ctx, colors } = s;
    const hills = Array.from({ length: 7 }, () => ({
        x: Math.random() * s.width,
        y: Math.random() * s.height,
        h: 0.5 + Math.random() * 0.7,
        r: 90 + Math.random() * 90
    }));
    s.onClick((p) => {
        hills.push({ ...p, h: 0.9, r: 110 });
        if (hills.length > 14) hills.shift();
    });

    let goal: Point = { x: s.width / 2, y: s.height / 2 };
    const loss = (x: number, y: number) => {
        let v = ((x - goal.x) ** 2 + (y - goal.y) ** 2) / (s.width * s.width * 0.18);
        for (const k of hills) v += k.h * Math.exp(-((x - k.x) ** 2 + (y - k.y) ** 2) / (2 * k.r * k.r));
        return v;
    };
    const spawn = () => ({ x: Math.random() * s.width, y: Math.random() * s.height, vx: 0, vy: 0, life: 0 });
    const balls = Array.from({ length: OPTIMISERS }, spawn);
    const trails = balls.map(() => [] as Point[]);

    let t = 0;
    s.loop(() => {
        goal = s.pointer() ?? s.wander((t += 0.003));
        const W = s.width,
            H = s.height;
        ctx.clearRect(0, 0, W, H);
        // The landscape: a dot grid, brighter where the loss is low
        ctx.fillStyle = colors.cold;
        for (let y = CELL / 2; y < H; y += CELL)
            for (let x = CELL / 2; x < W; x += CELL) {
                ctx.globalAlpha = Math.max(0.14, 0.8 - loss(x, y) * 0.55);
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        // Optimisers: momentum SGD, each leaving a short trail
        ctx.strokeStyle = colors.signal;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.75;
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
            ctx.beginPath();
            trails[i].forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    });
}
