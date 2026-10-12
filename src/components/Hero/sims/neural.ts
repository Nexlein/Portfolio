/**
 * A drifting network: neurons link when they are close. The cursor excites the neurons around it and the
 * activation spreads along the links, then fades. A click sends a stronger pulse.
 */
import type { Point, Stage } from './stage';

const RANGE = 150;
const REACH = 100;
const FADE = 0.95;
const SPREAD = 0.6;

interface Neuron extends Point {
    vx: number;
    vy: number;
    r: number;
    pulse: number;
}

export interface Link {
    a: number;
    b: number;
    /** 1 for touching neurons, towards 0 at the edge of the range. */
    weight: number;
}

/** One step of activation: every neuron fades, and takes what its most active linked neighbour passes on. */
export function propagate(act: number[], links: Link[]): number[] {
    const next = act.map((v) => v * FADE);
    for (const { a, b, weight } of links) {
        next[a] = Math.max(next[a], act[b] * SPREAD * weight);
        next[b] = Math.max(next[b], act[a] * SPREAD * weight);
    }
    return next;
}

export function neural(s: Stage): void {
    const { ctx, colors } = s;
    const count = Math.max(30, Math.min(80, Math.round((s.width * s.height) / 14000)));
    const neurons: Neuron[] = Array.from({ length: count }, () => ({
        x: Math.random() * s.width,
        y: Math.random() * s.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: 2.5 + Math.random() * 2.5,
        pulse: Math.random() * Math.PI * 2
    }));
    let act: number[] = Array.from({ length: count }, () => 0);

    const excite = (at: Point, radius: number) =>
        neurons.forEach((n, i) => {
            act[i] = Math.max(act[i], 1 - Math.hypot(n.x - at.x, n.y - at.y) / radius);
        });
    s.onClick((p) => excite(p, 160));

    const links = (): Link[] => {
        const out: Link[] = [];
        for (let a = 0; a < count; a++)
            for (let b = a + 1; b < count; b++) {
                const d = Math.hypot(neurons[a].x - neurons[b].x, neurons[a].y - neurons[b].y);
                if (d < RANGE) out.push({ a, b, weight: 1 - d / RANGE });
            }
        return out;
    };

    const draw = (all: Link[]) => {
        ctx.clearRect(0, 0, s.width, s.height);
        ctx.lineWidth = 1.2;
        for (const { a, b, weight } of all) {
            const lit = Math.max(act[a], act[b]);
            ctx.strokeStyle = lit > 0.2 ? colors.signal : colors.cold;
            ctx.globalAlpha = weight * 0.35 + lit * 0.6;
            ctx.beginPath();
            ctx.moveTo(neurons[a].x, neurons[a].y);
            ctx.lineTo(neurons[b].x, neurons[b].y);
            ctx.stroke();
        }
        neurons.forEach((n, i) => {
            const glow = (Math.sin(n.pulse) + 1) / 2;
            ctx.fillStyle = act[i] > 0.2 ? colors.signal : colors.cold;
            ctx.globalAlpha = 0.5 + glow * 0.3 + act[i] * 0.2;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r + glow * 1.2 + act[i] * 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    };

    let nextSpark = 0;
    s.loop((now) => {
        const W = s.width,
            H = s.height;
        for (const n of neurons) {
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
            n.pulse += 0.03;
        }
        const pointer = s.pointer();
        if (pointer) excite(pointer, REACH);
        else if (now > nextSpark) {
            // Nobody is pointing: a neuron fires now and then, so the network is never idle
            const i = Math.floor(Math.random() * count);
            act[i] = 1;
            nextSpark = now + 900;
        }
        if (s.reduced) excite({ x: W * 0.65, y: H * 0.4 }, 220);
        const all = links();
        act = propagate(act, all);
        draw(all);
    });
}
