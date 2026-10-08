// PROTOTYPE — Round 13 hero simulations, beside variant-a's value iteration. Each one draws on its own canvas, reads the
// theme from CSS variables, reacts to the cursor and to clicks, and stops when its canvas leaves the page.
import { policyField } from './variant-a';

export interface Sim {
    name: string;
    hint: string;
    run: (canvas: HTMLCanvasElement) => void;
}

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function setup(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    const colors = { line: '', cold: '', signal: '', muted: '' };
    const read = () => {
        const s = getComputedStyle(canvas.parentElement!);
        for (const k of Object.keys(colors) as (keyof typeof colors)[]) colors[k] = s.getPropertyValue(`--${k}`).trim();
    };
    const size = () => {
        const dpr = Math.min(2, devicePixelRatio || 1);
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    let pointer: { x: number; y: number } | null = null;
    const host = canvas.parentElement!;
    host.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    host.addEventListener('pointerleave', () => (pointer = null));
    window.addEventListener('proto-theme', read);
    window.addEventListener('resize', size);
    read();
    size();
    // Off-screen, the simulation stops computing (battery, phones)
    let seen = true;
    new IntersectionObserver(([e]) => (seen = e.isIntersecting)).observe(canvas);
    return {
        ctx,
        colors,
        pointer: () => pointer,
        W: () => canvas.clientWidth,
        H: () => canvas.clientHeight,
        seen: () => seen
    };
}

/** When nobody points, a slow wandering target keeps the scene alive. */
const wander = (t: number, W: number, H: number) => ({
    x: W * (0.55 + 0.3 * Math.sin(t)),
    y: H * (0.42 + 0.25 * Math.sin(t * 1.7))
});

// ── Flocking: separation, alignment, cohesion; the cursor is food, a click scares them ──
function boids(canvas: HTMLCanvasElement): void {
    const { ctx, colors, pointer, W, H, seen } = setup(canvas);
    const N = 200;
    const b = Array.from({ length: N }, () => ({
        x: Math.random() * W(),
        y: Math.random() * H(),
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1
    }));
    let scare: { x: number; y: number; until: number } | null = null;
    canvas.parentElement!.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        const r = canvas.getBoundingClientRect();
        scare = { x: e.clientX - r.left, y: e.clientY - r.top, until: performance.now() + 900 };
    });
    let t = 0;
    const step = () => {
        const goal = pointer() ?? wander((t += 0.004), W(), H());
        const now = performance.now();
        for (const a of b) {
            let sx = 0,
                sy = 0,
                ax = 0,
                ay = 0,
                cx = 0,
                cy = 0,
                n = 0;
            for (const o of b) {
                if (o === a) continue;
                const dx = o.x - a.x,
                    dy = o.y - a.y,
                    d2 = dx * dx + dy * dy;
                if (d2 > 2500) continue;
                n++;
                ax += o.vx;
                ay += o.vy;
                cx += o.x;
                cy += o.y;
                if (d2 < 300) {
                    sx -= dx / (d2 || 1);
                    sy -= dy / (d2 || 1);
                }
            }
            if (n) {
                a.vx += (ax / n - a.vx) * 0.05 + (cx / n - a.x) * 0.0015;
                a.vy += (ay / n - a.vy) * 0.05 + (cy / n - a.y) * 0.0015;
            }
            a.vx += sx * 1.4;
            a.vy += sy * 1.4;
            const gx = goal.x - a.x,
                gy = goal.y - a.y,
                gd = Math.hypot(gx, gy) || 1;
            a.vx += (gx / gd) * 0.09;
            a.vy += (gy / gd) * 0.09;
            if (scare && now < scare.until) {
                const fx = a.x - scare.x,
                    fy = a.y - scare.y,
                    fd = Math.hypot(fx, fy) || 1;
                if (fd < 220) {
                    a.vx += (fx / fd) * 0.9;
                    a.vy += (fy / fd) * 0.9;
                }
            }
            const sp = Math.hypot(a.vx, a.vy),
                max = 3.2;
            if (sp > max) {
                a.vx = (a.vx / sp) * max;
                a.vy = (a.vy / sp) * max;
            }
            a.x = (a.x + a.vx + W()) % W();
            a.y = (a.y + a.vy + H()) % H();
        }
        return goal;
    };
    const draw = (goal: { x: number; y: number }) => {
        ctx.clearRect(0, 0, W(), H());
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (const a of b) {
            const near = Math.max(0, 1 - Math.hypot(goal.x - a.x, goal.y - a.y) / 260);
            ctx.strokeStyle = near > 0.15 ? colors.signal : colors.cold;
            ctx.globalAlpha = 0.45 + near * 0.55;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(a.x - a.vx * 4, a.y - a.vy * 4);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    };
    if (reduce()) return draw(step());
    const frame = () => {
        if (!canvas.isConnected) return;
        if (seen()) draw(step());
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}

// ── Gradient descent: the cursor is the minimum of a bumpy loss; a click adds a hill ──
function descent(canvas: HTMLCanvasElement): void {
    const { ctx, colors, pointer, W, H, seen } = setup(canvas);
    const hills = Array.from({ length: 7 }, () => ({
        x: Math.random() * W(),
        y: Math.random() * H(),
        h: 0.5 + Math.random() * 0.7,
        r: 90 + Math.random() * 90
    }));
    canvas.parentElement!.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        const r = canvas.getBoundingClientRect();
        hills.push({ x: e.clientX - r.left, y: e.clientY - r.top, h: 0.9, r: 110 });
        if (hills.length > 14) hills.shift();
    });
    let goal = { x: W() / 2, y: H() / 2 };
    const loss = (x: number, y: number) => {
        let v = ((x - goal.x) ** 2 + (y - goal.y) ** 2) / (W() * W() * 0.18);
        for (const k of hills) v += k.h * Math.exp(-((x - k.x) ** 2 + (y - k.y) ** 2) / (2 * k.r * k.r));
        return v;
    };
    const spawn = () => ({ x: Math.random() * W(), y: Math.random() * H(), vx: 0, vy: 0, life: 0 });
    const balls = Array.from({ length: 110 }, spawn);
    const trail = balls.map(() => [] as { x: number; y: number }[]);
    let t = 0;
    const draw = () => {
        goal = pointer() ?? wander((t += 0.003), W(), H());
        ctx.clearRect(0, 0, W(), H());
        // The landscape: a dot grid, brighter where the loss is low
        const CELL = 26;
        ctx.fillStyle = colors.cold;
        for (let y = CELL / 2; y < H(); y += CELL)
            for (let x = CELL / 2; x < W(); x += CELL) {
                const v = loss(x, y);
                ctx.globalAlpha = Math.max(0.14, 0.8 - v * 0.55);
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        // Optimisers: momentum SGD, each leaving a short trail
        ctx.strokeStyle = colors.signal;
        ctx.lineWidth = 1.4;
        balls.forEach((p, i) => {
            const e = 1,
                gx = (loss(p.x + e, p.y) - loss(p.x - e, p.y)) / (2 * e),
                gy = (loss(p.x, p.y + e) - loss(p.x, p.y - e)) / (2 * e);
            p.vx = p.vx * 0.9 - gx * 160;
            p.vy = p.vy * 0.9 - gy * 160;
            p.x += p.vx;
            p.y += p.vy;
            p.life++;
            trail[i].push({ x: p.x, y: p.y });
            if (trail[i].length > 30) trail[i].shift();
            if (
                p.life > 420 ||
                (p.life > 60 && Math.hypot(p.vx, p.vy) < 0.05) ||
                p.x < -20 ||
                p.y < -20 ||
                p.x > W() + 20 ||
                p.y > H() + 20
            ) {
                Object.assign(p, spawn());
                trail[i] = [];
            }
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            trail[i].forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    };
    if (reduce()) return draw();
    const frame = () => {
        if (!canvas.isConnected) return;
        if (seen()) draw();
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}

export const SIMS: Sim[] = [
    { name: 'Value iteration', hint: 'Your cursor is the reward. Click to place a wall.', run: policyField },
    { name: 'Flocking agents', hint: 'They chase your cursor. Click to scare them.', run: boids },
    { name: 'Gradient descent', hint: 'Your cursor is the minimum. Click to add a hill.', run: descent }
];
