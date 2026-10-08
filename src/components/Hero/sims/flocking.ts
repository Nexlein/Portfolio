/**
 * Flocking agents (separation, alignment, cohesion). The cursor is food; a click scares them away.
 */
import type { Point, Stage } from './stage';

const N = 200;
const MAX_SPEED = 3.2;

export function flocking(s: Stage): void {
    const { ctx, colors } = s;
    const agents = Array.from({ length: N }, () => ({
        x: Math.random() * s.width,
        y: Math.random() * s.height,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1
    }));
    let scare: (Point & { until: number }) | null = null;
    s.onClick((p) => (scare = { ...p, until: performance.now() + 900 }));

    const step = (goal: Point, now: number) => {
        const W = s.width,
            H = s.height;
        for (const a of agents) {
            let sx = 0,
                sy = 0,
                ax = 0,
                ay = 0,
                cx = 0,
                cy = 0,
                n = 0;
            for (const o of agents) {
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
            const sp = Math.hypot(a.vx, a.vy);
            if (sp > MAX_SPEED) {
                a.vx = (a.vx / sp) * MAX_SPEED;
                a.vy = (a.vy / sp) * MAX_SPEED;
            }
            a.x = (a.x + a.vx + W) % W;
            a.y = (a.y + a.vy + H) % H;
        }
    };

    const draw = (goal: Point) => {
        ctx.clearRect(0, 0, s.width, s.height);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (const a of agents) {
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

    let t = 0;
    s.loop((now) => {
        const goal = s.pointer() ?? s.wander((t += 0.004));
        step(goal, now);
        draw(goal);
    });
}
