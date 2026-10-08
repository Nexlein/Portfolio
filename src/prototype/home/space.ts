// PROTOTYPE — Round 5 (H) "Latent space": you at the centre, projects around you.
// Angle = similarity (classical MDS on skill overlap), distance = time (recent work closest), depth layers + parallax.
import './space.css';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { metaLine, oneLiner, still } from './round2';
import { detail, variantF } from './round3';

export const ICONS: Record<ProjectEntry['category'], string> = {
    ai: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8M17 8l-4 8"/>',
    architecture: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    systems: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
    graphical: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/>',
    devops: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'
};

/** Orbit per period: recent work closest to the centre. */
const RING: Record<string, number> = { Personal: 0.4, Tek2: 0.68, Tek1: 0.94 };
export const yearOf = (p: ProjectEntry) => p.year ?? 'Tek2';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function skillSet(p: ProjectEntry): Set<string> {
    const out = new Set<string>();
    for (const raw of p.tags)
        for (const part of raw.toLowerCase().split('/')) {
            const t = part.trim();
            out.add(['rl', 'gymnasium', 'stable-baselines3'].includes(t) ? 'reinforcement learning' : t);
        }
    out.add(`domain:${p.category}`); // same domain counts as shared ground
    return out;
}

/** Jaccard similarity of two projects' skills (0..1). */
function similarity(a: ProjectEntry, b: ProjectEntry): number {
    const sa = skillSet(a),
        sb = skillSet(b);
    const inter = [...sa].filter((t) => sb.has(t)).length;
    return inter / (sa.size + sb.size - inter);
}

/** Classical MDS: 2D coordinates whose distances approximate 1 - similarity. */
export function mds(items: ProjectEntry[]): [number, number][] {
    const n = items.length;
    const d2 = items.map((a) => items.map((b) => (1 - similarity(a, b)) ** 2));
    const rowMean = d2.map((r) => r.reduce((s, v) => s + v, 0) / n);
    const all = rowMean.reduce((s, v) => s + v, 0) / n;
    const B = d2.map((r, i) => r.map((v, j) => -0.5 * (v - rowMean[i] - rowMean[j] + all)));
    const eig = (deflate: number[][]): { vec: number[]; val: number } => {
        let v = items.map((_, i) => Math.sin(i + 1));
        let val = 0;
        for (let it = 0; it < 200; it++) {
            const w = deflate.map((r) => r.reduce((s, x, j) => s + x * v[j], 0));
            val = Math.hypot(...w) || 1;
            v = w.map((x) => x / val);
        }
        return { vec: v, val };
    };
    const e1 = eig(B);
    const B2 = B.map((r, i) => r.map((x, j) => x - e1.val * e1.vec[i] * e1.vec[j]));
    const e2 = eig(B2);
    return items.map((_, i) => [e1.vec[i] * Math.sqrt(e1.val), e2.vec[i] * Math.sqrt(e2.val)]);
}

/** The 3 most similar projects (an embedding projector's nearest neighbours). */
export function neighbours(p: ProjectEntry): { q: ProjectEntry; s: number }[] {
    const scored = PROJECTS.filter((q) => q !== p).map((q) => ({ q, s: similarity(p, q) }));
    const top: { q: ProjectEntry; s: number }[] = [];
    for (let k = 0; k < 3; k++) {
        const best = scored.reduce((a, b) => (b.s > a.s && !top.includes(b) ? b : a), { q: p, s: -1 });
        top.push(best);
        scored.splice(scored.indexOf(best), 1);
    }
    return top;
}

export interface Star {
    p: ProjectEntry;
    x: number; // resting position
    y: number;
    depth: number; // 0 far .. 1 near
    phase: number;
}

/** Lay the projects out round the centre. With `fit`, cards stay inside that ellipse instead of the board's rectangle. */
export function layout(W: number, H: number, fit?: { rx: number; ry: number }): Star[] {
    const coords = mds(PROJECTS);
    const cx = W / 2,
        cy = H / 2,
        rx = fit ? fit.rx : W * 0.44,
        ry = fit ? fit.ry : H * 0.47;
    // Similar projects share a direction; spread directions round the full circle while keeping their order
    const raw = coords.map(([x, y]) => Math.atan2(y, x));
    const rank = raw.map((a, i) => raw.filter((b, j) => b < a || (b === a && j < i)).length);
    const stars: Star[] = PROJECTS.map((p, i) => {
        const even = -Math.PI + (2 * Math.PI * (rank[i] + 0.5)) / raw.length;
        const angle = even * 0.7 + raw[i] * 0.3;
        const r = RING[yearOf(p)];
        return {
            p,
            x: cx + Math.cos(angle) * rx * r,
            y: cy + Math.sin(angle) * ry * r,
            depth: 1 - (r - 0.4) / 0.6,
            phase: i * 2.399
        };
    });
    // Nudge apart along the orbit so cards never overlap
    const CW = 190,
        CH = 52,
        GAP = 22;
    for (let pass = 0; pass < 200; pass++) {
        for (let i = 0; i < stars.length; i++)
            for (let j = i + 1; j < stars.length; j++) {
                const a = stars[i],
                    b = stars[j],
                    dx = b.x - a.x,
                    dy = b.y - a.y;
                const ox = CW + GAP - Math.abs(dx),
                    oy = CH + GAP - Math.abs(dy);
                if (ox <= 0 || oy <= 0) continue;
                if (ox / CW < oy / CH) {
                    a.x -= (ox / 2) * Math.sign(dx || 1);
                    b.x += (ox / 2) * Math.sign(dx || 1);
                } else {
                    a.y -= (oy / 2) * Math.sign(dy || 1);
                    b.y += (oy / 2) * Math.sign(dy || 1);
                }
            }
        for (const s of stars) {
            s.x = Math.min(W - CW / 2 - 16, Math.max(CW / 2 + 16, s.x));
            s.y = Math.min(H - CH / 2 - 24, Math.max(CH / 2 + 24, s.y));
            if (fit) {
                const n = Math.hypot((s.x - cx) / rx, (s.y - cy) / ry);
                if (n > 1) {
                    s.x = cx + (s.x - cx) / n;
                    s.y = cy + (s.y - cy) / n;
                }
            }
            // keep clear of the core
            const dx = s.x - cx,
                dy = s.y - cy,
                d = Math.hypot(dx / 1.6, dy);
            if (d < 120) {
                s.x = cx + (dx / (d || 1)) * 120 * 1.6;
                s.y = cy + (dy / (d || 1)) * 120;
            }
        }
    }
    return stars;
}

export function mountSpace(host: HTMLElement, detailHost: HTMLElement): (domain: string) => void {
    host.innerHTML = `<div class="vh-space" aria-label="Projects around me: direction groups similar projects, distance shows when (closest is most recent). Select one to open it.">
<svg><g class="rings"></g><g class="threads">${PROJECTS.map((p) => `<line class="ray" data-id="${p.id}" />`).join('')}</g><g class="links"></g></svg>
<div class="vh-core"><span class="dot"></span><span class="orbit"></span><span class="label mono">N. Combe-Bracciale<br />trained on ${PROJECTS.length} projects</span></div>
${PROJECTS.map(
    (
        p
    ) => `<button type="button" class="vh-card" data-id="${p.id}" data-domain="${p.category}"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[p.category]}</svg></span>
<span class="txt"><strong>${p.title}</strong><span class="mono">${yearOf(p)} · ${p.tags[0]}</span></span></button>`
).join('')}
<div class="vf-peek vh-peek"></div>
<p class="vh-legend mono"><span class="you"></span>you · closer = more recent · direction = shared skills · hover a project for its nearest neighbours</p></div>`;

    const space = host.querySelector<HTMLElement>('.vh-space')!;
    const peek = space.querySelector<HTMLElement>('.vh-peek')!;
    const core = space.querySelector<HTMLElement>('.vh-core')!;
    const cards = new Map([...space.querySelectorAll<HTMLButtonElement>('.vh-card')].map((c) => [c.dataset.id!, c]));
    const rays = new Map([...space.querySelectorAll<SVGLineElement>('.ray')].map((l) => [l.dataset.id!, l]));
    const linksG = space.querySelector('.links')!;
    const ringsG = space.querySelector('.rings')!;
    let stars: Star[] = [];
    const shown = new Map<string, { x: number; y: number }>();

    const build = () => {
        stars = layout(space.clientWidth, space.clientHeight);
        const W = space.clientWidth,
            H = space.clientHeight;
        ringsG.innerHTML = Object.entries(RING)
            .map(([, r]) => `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${W * 0.44 * r}" ry="${H * 0.47 * r}" />`)
            .join('');
        core.style.left = `${W / 2}px`;
        core.style.top = `${H / 2}px`;
    };

    // Smooth motion: layered slow sines (no jitter) + mouse parallax by depth, all eased
    let mouse = { x: 0, y: 0 },
        parallax = { x: 0, y: 0 },
        speed = 1,
        targetSpeed = 1,
        clock = 0,
        last = performance.now();
    space.addEventListener('pointermove', (e) => {
        const r = space.getBoundingClientRect();
        mouse = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
    });
    space.addEventListener('pointerenter', () => (targetSpeed = 0.15)); // slow down, don't freeze
    space.addEventListener('pointerleave', () => {
        targetSpeed = 1;
        mouse = { x: 0, y: 0 };
    });
    space.addEventListener('focusin', () => (targetSpeed = 0));
    space.addEventListener('focusout', () => (targetSpeed = 1));

    const frame = (now: number) => {
        if (!space.isConnected) return;
        const dt = Math.min(50, now - last);
        last = now;
        const frozen = reduceMotion();
        speed += (targetSpeed - speed) * 0.05;
        clock += dt * (frozen ? 0 : speed);
        parallax.x += ((frozen ? 0 : mouse.x) - parallax.x) * 0.06;
        parallax.y += ((frozen ? 0 : mouse.y) - parallax.y) * 0.06;
        const cx = space.clientWidth / 2,
            cy = space.clientHeight / 2;
        for (const s of stars) {
            const t = clock / 1000;
            const dx = Math.sin(t / 9 + s.phase) * 9 + Math.sin(t / 15.7 + s.phase * 1.3) * 5;
            const dy = Math.cos(t / 11 + s.phase) * 7 + Math.sin(t / 19.3 + s.phase * 0.7) * 4;
            const px = -parallax.x * (10 + 34 * s.depth),
                py = -parallax.y * (8 + 26 * s.depth);
            const x = s.x + dx + px,
                y = s.y + dy + py;
            shown.set(s.p.id, { x, y });
            const el = cards.get(s.p.id)!;
            el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${0.86 + s.depth * 0.18})`;
            el.style.setProperty('--depth', String(s.depth));
            const ray = rays.get(s.p.id)!;
            ray.setAttribute('x1', String(cx - parallax.x * 6));
            ray.setAttribute('y1', String(cy - parallax.y * 6));
            ray.setAttribute('x2', String(x));
            ray.setAttribute('y2', String(y));
        }
        core.style.translate = `${-parallax.x * 6}px ${-parallax.y * 6}px`;
        requestAnimationFrame(frame);
    };

    const focus = (id: string | null) => {
        space.classList.toggle('focus', id !== null);
        linksG.innerHTML = '';
        cards.forEach((c) => {
            c.classList.remove('lit', 'nn');
            delete c.dataset.score;
        });
        rays.forEach((r) => r.classList.remove('hot'));
        if (!id) return peek.classList.remove('on');
        const p = PROJECTS.find((x) => x.id === id)!,
            at = shown.get(id)!;
        cards.get(id)!.classList.add('lit');
        rays.get(id)!.classList.add('hot');
        const nn = neighbours(p);
        // Nearest neighbours, like an embedding projector
        linksG.innerHTML = nn
            .map(({ q, s }) => {
                const b = shown.get(q.id)!;
                const card = cards.get(q.id)!;
                card.classList.add('nn');
                card.dataset.score = `similarity ${s.toFixed(2)}`;
                return `<line class="nn-link" x1="${at.x}" y1="${at.y}" x2="${b.x}" y2="${b.y}" />`;
            })
            .join('');
        peek.innerHTML = `<div class="vr-media"><img src="${still(p)}" alt="" /></div><div class="txt">${metaLine(p)}<p>${oneLiner(p)}</p>
<p class="mono">nearest: ${nn.map(({ q }) => q.title).join(', ')}</p></div>`;
        // Opposite corner: never covers the core, the hovered card or its neighbours
        const w = peek.offsetWidth,
            h = peek.offsetHeight;
        const left = at.x > space.clientWidth / 2,
            top = at.y > space.clientHeight / 2;
        peek.style.left = `${left ? 24 : space.clientWidth - w - 24}px`;
        peek.style.top = `${top ? 24 : space.clientHeight - h - 60}px`;
        peek.classList.add('on');
    };

    const open = (id: string) => {
        cards.forEach((c, cid) => c.classList.toggle('selected', cid === id));
        detailHost.innerHTML = `<div class="vf-detail">${detail(
            PROJECTS.find((p) => p.id === id)!,
            true
        )}</div>`;
        detailHost.querySelector('.vf-close')!.addEventListener('click', () => {
            detailHost.innerHTML = '';
            cards.forEach((c) => c.classList.remove('selected'));
        });
        detailHost.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
    };

    cards.forEach((c, id) => {
        c.addEventListener('mouseenter', () => focus(id));
        c.addEventListener('focus', () => focus(id));
        c.addEventListener('mouseleave', () => focus(null));
        c.addEventListener('blur', () => focus(null));
        c.addEventListener('click', () => open(id));
    });

    build();
    window.addEventListener('resize', build);
    requestAnimationFrame(frame);

    return (domain: string) => {
        space.classList.toggle('dim-domain', domain !== 'all');
        cards.forEach((c) => c.classList.toggle('in-domain', c.dataset.domain === domain));
    };
}

export const variantH = (root: HTMLElement) => variantF(root, mountSpace, 'Space', true);
