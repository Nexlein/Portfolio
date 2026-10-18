/**
 * The maths behind the project map, without any DOM: which projects are similar, where each one sits, and which
 * ones are shown when there are more than the map can hold.
 * - Similarity: Jaccard overlap of skills (tags split on '/', RL aliases merged, same domain counts as shared).
 * - Direction from the centre = similarity (classical MDS), distance = period (recent work closest).
 */
import type { ProjectEntry } from '../../data/projects.ts';

export type Period = 'Personal' | 'Tek2' | 'Tek1';

/** Period of a project; untagged school projects are second-year ones. */
export const periodOf = (p: ProjectEntry): Period => p.year ?? 'Tek2';

/** Orbit per period, as a fraction of the usable ellipse: recent work closest to the centre. */
export const ORBIT: Record<Period, number> = { Personal: 0.4, Tek2: 0.68, Tek1: 0.94 };

/** Card size the layout keeps apart (px). */
export const CARD = { w: 190, h: 52, gap: 22 };

const RL = new Set(['rl', 'gymnasium', 'stable-baselines3']);

export function skillSet(p: ProjectEntry): Set<string> {
    const out = new Set<string>();
    for (const raw of p.tags)
        for (const part of raw.toLowerCase().split('/')) {
            const t = part.trim();
            if (t) out.add(RL.has(t) ? 'reinforcement learning' : t);
        }
    out.add(`domain:${p.category}`);
    return out;
}

/** Jaccard similarity of two projects' skills, 0..1. */
export function similarity(a: ProjectEntry, b: ProjectEntry): number {
    const sa = skillSet(a),
        sb = skillSet(b);
    const inter = [...sa].filter((t) => sb.has(t)).length;
    return inter / (sa.size + sb.size - inter);
}

/** The 3 most similar projects in `pool`. */
export function neighbours(p: ProjectEntry, pool: ProjectEntry[]): { q: ProjectEntry; s: number }[] {
    const scored = pool.filter((q) => q !== p).map((q) => ({ q, s: similarity(p, q) }));
    const top: { q: ProjectEntry; s: number }[] = [];
    for (let k = 0; k < 3 && scored.length; k++) {
        const best = scored.reduce((a, b) => (b.s > a.s ? b : a));
        top.push(best);
        scored.splice(scored.indexOf(best), 1);
    }
    return top;
}

/** Classical MDS: 2D coordinates whose distances approximate 1 - similarity. */
export function mds(items: ProjectEntry[]): [number, number][] {
    const n = items.length;
    const d2 = items.map((a) => items.map((b) => (1 - similarity(a, b)) ** 2));
    const rowMean = d2.map((r) => r.reduce((s, v) => s + v, 0) / n);
    const all = rowMean.reduce((s, v) => s + v, 0) / n;
    const B = d2.map((r, i) => r.map((v, j) => -0.5 * (v - rowMean[i] - rowMean[j] + all)));
    const eig = (m: number[][]) => {
        let v = items.map((_, i) => Math.sin(i + 1));
        let val = 0;
        for (let it = 0; it < 200; it++) {
            const w = m.map((r) => r.reduce((s, x, j) => s + x * v[j], 0));
            val = Math.hypot(...w) || 1;
            v = w.map((x) => x / val);
        }
        return { vec: v, val };
    };
    const e1 = eig(B);
    const e2 = eig(B.map((r, i) => r.map((x, j) => x - e1.val * e1.vec[i] * e1.vec[j])));
    return items.map((_, i) => [e1.vec[i] * Math.sqrt(e1.val), e2.vec[i] * Math.sqrt(e2.val)]);
}

export interface Star {
    p: ProjectEntry;
    /** Resting position (px). */
    x: number;
    y: number;
}

/**
 * Lay `items` out round the centre of a W×H board, card centres inside the ellipse `fit`. Similar projects share a
 * direction, periods sit on their orbit, then cards are nudged apart until none overlap.
 */
export function layout(W: number, H: number, fit: { rx: number; ry: number }, items: ProjectEntry[]): Star[] {
    const coords = mds(items);
    // How much the similarity directions bend the even spread round the circle. Settling is a heuristic: when a crowded
    // board leaves cards overlapping or past the ellipse, a more even start usually settles cleanly, so try in turn
    let best: { stars: Star[]; cost: number } | undefined;
    for (const bend of BENDS) {
        const stars = settle(W, H, fit, items, coords, bend);
        const cost = layoutCost(W, H, fit, stars);
        if (cost === 0) return stars;
        if (!best || cost < best.cost) best = { stars, cost };
    }
    return best!.stars;
}

const BENDS = [0.3, 0.2, 0.1, 0];

/** 0 when no two cards overlap and every card sits inside the ellipse; overlaps weigh more than overflow. */
function layoutCost(W: number, H: number, fit: { rx: number; ry: number }, stars: Star[]): number {
    let cost = 0;
    for (let i = 0; i < stars.length; i++) {
        const a = stars[i];
        for (let j = i + 1; j < stars.length; j++)
            if (Math.abs(a.x - stars[j].x) < CARD.w && Math.abs(a.y - stars[j].y) < CARD.h) cost += 10;
        cost += Math.max(0, Math.hypot((a.x - W / 2) / fit.rx, (a.y - H / 2) / fit.ry) - 1.001);
    }
    return cost;
}

function settle(
    W: number,
    H: number,
    fit: { rx: number; ry: number },
    items: ProjectEntry[],
    coords: [number, number][],
    bend: number
): Star[] {
    const cx = W / 2,
        cy = H / 2;
    // Spread directions round the full circle while keeping their order
    const raw = coords.map(([x, y]) => Math.atan2(y, x));
    const rank = raw.map((a, i) => raw.filter((b, j) => b < a || (b === a && j < i)).length);
    const stars = items.map((p, i) => {
        const angle = (-Math.PI + (2 * Math.PI * (rank[i] + 0.5)) / raw.length) * (1 - bend) + raw[i] * bend;
        const r = ORBIT[periodOf(p)];
        return { p, x: cx + Math.cos(angle) * fit.rx * r, y: cy + Math.sin(angle) * fit.ry * r };
    });
    const { w, h, gap } = CARD;
    /** One round of pushing overlapping cards apart along the axis with the smaller overlap. */
    const separate = () => {
        let moved = false;
        for (let i = 0; i < stars.length; i++)
            for (let j = i + 1; j < stars.length; j++) {
                const a = stars[i],
                    b = stars[j],
                    dx = b.x - a.x,
                    dy = b.y - a.y;
                const ox = w + gap - Math.abs(dx),
                    oy = h + gap - Math.abs(dy);
                if (ox <= 0 || oy <= 0) continue;
                moved = true;
                if (ox / w < oy / h) {
                    a.x -= (ox / 2) * Math.sign(dx || 1);
                    b.x += (ox / 2) * Math.sign(dx || 1);
                } else {
                    a.y -= (oy / 2) * Math.sign(dy || 1);
                    b.y += (oy / 2) * Math.sign(dy || 1);
                }
            }
        return moved;
    };
    /** Clear of the "Now" block in the middle. */
    const clearOfNow = (s: Star) => {
        const dx = s.x - cx,
            dy = s.y - cy,
            d = Math.hypot(dx / 1.6, dy);
        if (d < 120) {
            s.x = cx + (dx / (d || 1)) * 120 * 1.6;
            s.y = cy + (dy / (d || 1)) * 120;
        }
    };
    for (let pass = 0; pass < 240; pass++) {
        separate();
        for (const s of stars) {
            // Inside the ellipse, and clear of the "Now" block in the middle
            const n = Math.hypot((s.x - cx) / fit.rx, (s.y - cy) / fit.ry);
            if (n > 1) {
                s.x = cx + (s.x - cx) / n;
                s.y = cy + (s.y - cy) / n;
            }
            clearOfNow(s);
        }
    }
    // Where the ellipse is too tight for every card, overlap is worse than leaving it: keep separating, now only
    // held inside the board
    const touching = () =>
        stars.some((a, i) => stars.slice(i + 1).some((b) => Math.abs(a.x - b.x) < w && Math.abs(a.y - b.y) < h));
    for (let pass = 0; pass < 400 && touching(); pass++) {
        separate();
        for (const s of stars) {
            s.x = Math.min(W - w / 2, Math.max(w / 2, s.x));
            s.y = Math.min(H - h / 2, Math.max(h / 2, s.y));
            clearOfNow(s);
        }
    }
    return stars;
}

/** Usable ellipse for card centres on a W×H board (the outer layer, minus room for the cards themselves). */
export function fitFor(W: number, H: number): { rx: number; ry: number } {
    const ry = H / 2 - 26;
    return { rx: Math.min(W / 2 - 22, ry * 1.75) - 125, ry: ry - 44 };
}

/** Which projects the map shows when it can hold `max`: featured first, then the most recent periods. */
export function pickShown(projects: ProjectEntry[], max: number): { shown: ProjectEntry[]; hidden: ProjectEntry[] } {
    const ranked = [
        ...projects.filter((p) => p.featured),
        ...(['Personal', 'Tek2', 'Tek1'] as const).flatMap((y) =>
            projects.filter((p) => !p.featured && periodOf(p) === y)
        )
    ];
    return { shown: ranked.slice(0, max), hidden: ranked.slice(max) };
}
