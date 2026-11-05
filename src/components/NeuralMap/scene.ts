/**
 * What moves and where it goes on the project map, without any DOM: the map's card ports, its breeze, its hidden
 * neurons, where a layer's label fits, and the springs that move the cards. NeuralMap.ts draws the result.
 */
import { seeded } from '../../core/seeded.ts';
import { CARD } from './graph.ts';

export interface Pt {
    x: number;
    y: number;
}

/** Half a card: where a line from its centre leaves it. */
const HALF = { w: CARD.w / 2, h: CARD.h / 2 };

/** Where the line from a card's centre toward `to` leaves the card. */
export function port(c: Pt, to: Pt): Pt {
    const dx = to.x - c.x,
        dy = to.y - c.y;
    const t = Math.min(HALF.w / (Math.abs(dx) || 1e-6), HALF.h / (Math.abs(dy) || 1e-6), 1);
    return { x: c.x + dx * t, y: c.y + dy * t };
}

/** A point `u` of the way along a quadratic curve. */
export function quad(p: Pt, c: Pt, q: Pt, u: number): Pt {
    const v = 1 - u;
    return { x: v * v * p.x + 2 * u * v * c.x + u * u * q.x, y: v * v * p.y + 2 * u * v * c.y + u * u * q.y };
}

/** Slow breeze: two long travelling waves, so nearby things lean the same way. */
export function breeze(x: number, y: number, s: number): Pt {
    return {
        x: 35 * Math.sin(0.0042 * x - 0.0026 * y + 0.42 * s) + 18 * Math.sin(0.0019 * x + 0.0047 * y + 0.27 * s + 1.3),
        y: 27 * Math.cos(0.0035 * x + 0.0039 * y + 0.36 * s) + 14 * Math.sin(-0.0024 * x + 0.0051 * y + 0.23 * s + 0.7)
    };
}

/** The angle furthest from every `taken` one where `clear` holds; without any such angle, the furthest overall. */
export function widestGap(taken: number[], clear: (angle: number) => boolean): number {
    let best = { gap: -1, mid: -Math.PI / 2 },
        fallback = best;
    for (let k = 0; k < 48; k++) {
        const a = -Math.PI + (k / 48) * Math.PI * 2;
        const gap = Math.min(...taken.map((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))), Math.PI);
        if (gap > fallback.gap) fallback = { gap, mid: a };
        if (gap > best.gap && clear(a)) best = { gap, mid: a };
    }
    return (best.gap < 0 ? fallback : best).mid;
}

/** A hidden neuron's resting place, and how long it waits to appear (ms). */
export interface NeuronSpot extends Pt {
    delay: number;
}

const NEURONS = 72;
/** How far a neuron stays from the centre of "Now", and from another neuron (px). */
const NOW_CLEAR = { w: 170, h: 62 };
const NEURON_GAP = 34;
/** How far a wire reaches (px). */
const WIRE_REACH = 150;

/** Hidden neurons: seeded, inside the outer layer, clear of the cards, of "Now" and of each other. */
export function scatterNeurons(centre: Pt, fit: { rx: number; ry: number }, cards: Pt[]): NeuronSpot[] {
    const rnd = seeded(4242);
    const fx = fit.rx + 70,
        fy = fit.ry + 20;
    const spots: NeuronSpot[] = [];
    for (let tries = 0; spots.length < NEURONS && tries < 4000; tries++) {
        const x = centre.x + (rnd() * 2 - 1) * fx,
            y = centre.y + (rnd() * 2 - 1) * fy;
        if (Math.hypot((x - centre.x) / fx, (y - centre.y) / fy) > 1) continue;
        if (Math.abs(x - centre.x) < NOW_CLEAR.w && Math.abs(y - centre.y) < NOW_CLEAR.h) continue;
        if (cards.some((c) => Math.abs(x - c.x) < HALF.w + 14 && Math.abs(y - c.y) < HALF.h + 14)) continue;
        if (spots.some((n) => Math.hypot(n.x - x, n.y - y) < NEURON_GAP)) continue;
        spots.push({ x, y, delay: Math.round(rnd() * 500) });
    }
    return spots;
}

/** Sparse wiring: each neuron to its 2 nearest neurons (by index), and to a card if one is close. */
export function wireNeurons<C extends Pt>(spots: Pt[], cards: C[]): { from: number; to: number | C }[] {
    const wires: { from: number; to: number | C }[] = [];
    const wired = new Set<string>();
    spots.forEach((n, i) => {
        const near = spots
            .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
            .filter(({ j, d }) => j !== i && d < WIRE_REACH)
            .toSorted((a, b) => a.d - b.d)
            .slice(0, 2);
        for (const { j } of near) {
            const key = i < j ? `${i}|${j}` : `${j}|${i}`;
            if (wired.has(key)) continue;
            wired.add(key);
            wires.push({ from: i, to: j });
        }
        const card = cards.find((c) => Math.hypot(c.x - n.x, c.y - n.y) < WIRE_REACH);
        if (card) wires.push({ from: i, to: card });
    });
    return wires;
}

/** How hard a card is pulled back to its resting place; neurons lean on the breeze by the same measure. */
export const SPRING = 6;
const DAMP = 2.4;
const LINK = 3;

/** A card as the springs see it: where it rests, its offset from there and its speed. */
export interface Body extends Pt {
    star: Pt;
    hold: boolean;
    ox: number;
    oy: number;
    vx: number;
    vy: number;
}

/**
 * Living motion, one step of `dt` ms at `s` seconds: rest springs, the breeze, links as soft springs, the pull of the
 * cursor on the bodies it attends to. A held body stays exactly where it is.
 */
export function stepBodies<B extends Body>(
    bodies: B[],
    links: { a: B; b: B }[],
    pulls: { c: B; w: number }[],
    pointer: Pt | null,
    dt: number,
    s: number
): void {
    const h = Math.min(dt, 34) / 1000;
    const force = new Map<B, Pt>();
    for (const c of bodies) {
        const w = breeze(c.star.x, c.star.y, s);
        force.set(c, { x: w.x - SPRING * c.ox - DAMP * c.vx, y: w.y - SPRING * c.oy - DAMP * c.vy });
    }
    for (const { a, b } of links) {
        const dx = (b.ox - a.ox) * LINK,
            dy = (b.oy - a.oy) * LINK;
        force.get(a)!.x += dx;
        force.get(a)!.y += dy;
        force.get(b)!.x -= dx;
        force.get(b)!.y -= dy;
    }
    if (pointer)
        for (const { c, w } of pulls) {
            const dx = pointer.x - c.x,
                dy = pointer.y - c.y,
                d = Math.hypot(dx, dy) || 1;
            force.get(c)!.x += (dx / d) * 18 * w;
            force.get(c)!.y += (dy / d) * 18 * w;
        }
    for (const c of bodies) {
        if (c.hold) {
            c.vx = c.vy = 0;
            continue;
        }
        c.vx += force.get(c)!.x * h;
        c.vy += force.get(c)!.y * h;
        c.ox += c.vx * h;
        c.oy += c.vy * h;
    }
}
