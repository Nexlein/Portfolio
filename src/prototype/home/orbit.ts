// PROTOTYPE — Round 8 (K) "orbits": round 7 with fewer, more meaningful moving parts.
// - Each period is a silk loop strung through its own cards (Personal, Tek 2, Tek 1) and labelled in its widest gap:
//   the circular shape is the timeline itself, so no rim, no spokes, no dashed rings, no legend for "recent".
// - Similarity threads stay (the web), pluckable; cursor silk to the nearest cards stays.
// - One "thought" at a time: a single pulse walks 2-4 hops through similar projects, lighting the thread it travels.
// - Boot once on first view: Now, then each period's loop draws and its cards appear, then the web threads.
import './web.css';
import './silk.css';
import './orbit.css';
import { EXPERIENCES } from '@/data/profile';
import { PROJECTS, projectPath, type ProjectEntry } from '@/data/projects';
import { oneLiner, still } from './round2';
import { variantF } from './round3';
import { ICONS, layout, neighbours, yearOf, type Star } from './space';

const SVG = 'http://www.w3.org/2000/svg';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const OPEN_W = 330;
const SILK_REACH = 340;
const SILK_COUNT = 3;

/** Periods, inside out, with their label and orbit (fraction of the usable ellipse, as in space.ts). */
const PERIODS = [
    { key: 'Personal', label: 'personal · 2025–26', r: 0.4 },
    { key: 'Tek2', label: 'tek 2 · 2025–26', r: 0.68 },
    { key: 'Tek1', label: 'tek 1 · 2024–25', r: 0.94 }
] as const;

interface Pt {
    x: number;
    y: number;
}

interface Card extends Pt {
    star: Star;
    el: HTMLAnchorElement;
    clock: number;
    speed: number;
    hold: boolean;
    delay: number; // boot order
}

interface Thread {
    a: Card;
    b: Card;
    s: number;
    path: SVGPathElement;
    pluckAt: number;
    pluckDir: number;
    off: number;
}

interface Orbit {
    cards: Card[]; // in angular order
    gaps: Pt[]; // fixed points filling wide gaps, by angle, merged with the cards when drawing
    order: (Card | Pt)[];
    path: SVGPathElement;
}

interface Pulse {
    th: Thread;
    from: Card;
    t0: number;
    dur: number;
    hops: number; // how many more threads this thought walks after arriving
    dot: SVGCircleElement;
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, cls: string, parent: Element): SVGElementTagNameMap[K] {
    const node = document.createElementNS(SVG, tag);
    node.setAttribute('class', cls);
    parent.appendChild(node);
    return node;
}

function crossing(p1: Pt, p2: Pt, a: Pt, b: Pt): number {
    const side = (o: Pt, e: Pt, p: Pt) => (e.x - o.x) * (p.y - o.y) - (e.y - o.y) * (p.x - o.x);
    const d1 = side(a, b, p1),
        d2 = side(a, b, p2);
    return d1 * d2 < 0 && side(p1, p2, a) * side(p1, p2, b) < 0 ? Math.sign(d2) : 0;
}

function control(a: Pt, b: Pt, sag: number, off: number): Pt {
    const dx = b.x - a.x,
        dy = b.y - a.y,
        len = Math.hypot(dx, dy) || 1;
    return { x: (a.x + b.x) / 2 + (-dy / len) * off, y: (a.y + b.y) / 2 + len * sag + (dx / len) * off };
}

const f1 = (n: number) => n.toFixed(1);

function silk(a: Pt, b: Pt, sag: number, off = 0): string {
    const c = control(a, b, sag, off);
    return `M${f1(a.x)} ${f1(a.y)}Q${f1(c.x)} ${f1(c.y)} ${f1(b.x)} ${f1(b.y)}`;
}

function along(a: Pt, b: Pt, sag: number, off: number, u: number): Pt {
    const c = control(a, b, sag, off),
        v = 1 - u;
    return { x: v * v * a.x + 2 * u * v * c.x + u * u * b.x, y: v * v * a.y + 2 * u * v * c.y + u * u * b.y };
}

/** Closed Catmull-Rom loop through the points, as cubic Béziers. */
function loop(pts: Pt[]): string {
    const n = pts.length,
        at = (i: number) => pts[(i + n) % n];
    let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
    for (let i = 0; i < n; i++) {
        const p0 = at(i - 1),
            p1 = at(i),
            p2 = at(i + 1),
            p3 = at(i + 2);
        d += `C${f1(p1.x + (p2.x - p0.x) / 6)} ${f1(p1.y + (p2.y - p0.y) / 6)} ${f1(p2.x - (p3.x - p1.x) / 6)} ${f1(p2.y - (p3.y - p1.y) / 6)} ${f1(p2.x)} ${f1(p2.y)}`;
    }
    return `${d}Z`;
}

/** Items ordered by angle round the centre (rank by counting: no Array sort in this codebase's lint rules). */
function byAngle<T extends Pt>(items: T[], cx: number, cy: number): T[] {
    const a = items.map((p) => Math.atan2(p.y - cy, p.x - cx));
    const out: T[] = [];
    items.forEach((p, i) => (out[a.filter((v, j) => v < a[i] || (v === a[i] && j < i)).length] = p));
    return out;
}

const SUB: Record<string, string> = { Personal: 'personal', Tek2: 'tek 2', Tek1: 'tek 1' };

function cardHtml(p: ProjectEntry): string {
    return `<a class="vi-card" href="${projectPath(p.id)}" data-id="${p.id}" data-domain="${p.category}">
<span class="head"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[p.category]}</svg></span>
<span class="txt"><strong>${p.title}</strong><span class="mono">${p.tags.slice(0, 2).join(' · ')}</span></span></span>
<span class="more"><span class="inner">
  <span class="media"><img src="${still(p)}" alt="" loading="lazy" /></span>
  <span class="line">${oneLiner(p)}</span>
  <span class="mono skills">${SUB[yearOf(p)]} · ${p.tags.slice(0, 4).join(' · ')}</span>
  <span class="go">Open project <span aria-hidden="true">→</span></span>
</span></span></a>`;
}

function nowHtml(): string {
    const job = EXPERIENCES[0];
    return `<div class="vj-now">
<span class="mono eyebrow"><span class="live" aria-hidden="true"></span>Now</span>
<strong>${job.title.en.replace(' (Part-Time)', '')} at ${job.org}</strong>
<span class="line">RAG pipelines and conversational agents</span>
<span class="mono sub">${job.period.en} · Epitech year 3</span>
</div>`;
}

export function mountOrbits(host: HTMLElement): (domain: string) => void {
    host.innerHTML = `<div class="vi-web vj-web vk-web" aria-label="Projects on rings by period, the most recent closest to the centre; threads join similar projects. Hover or focus a project to preview it; select it to open its page.">
<svg><g class="orbits"></g><g class="threads"></g><g class="pulses"></g><g class="silks"></g><g class="labels"></g></svg>
${nowHtml()}
${PROJECTS.map(cardHtml).join('')}
<p class="vi-legend mono">threads join similar projects · hover to preview · click to open</p></div>`;

    const web = host.querySelector<HTMLElement>('.vk-web')!;
    const svg = web.querySelector('svg')!;
    const orbitsG = svg.querySelector('.orbits')!;
    const threadsG = svg.querySelector('.threads')!;
    const pulsesG = svg.querySelector('.pulses')!;
    const silksG = svg.querySelector('.silks')!;
    const labelsG = svg.querySelector('.labels')!;
    const now = web.querySelector<HTMLElement>('.vj-now')!;
    const els = [...web.querySelectorAll<HTMLAnchorElement>('.vi-card')];

    let cards: Card[] = [],
        threads: Thread[] = [],
        orbits: Orbit[] = [],
        pulses: Pulse[] = [];
    const spinneret = el('circle', 'spinneret', silksG);
    spinneret.setAttribute('r', '2.4');
    const silks = Array.from({ length: SILK_COUNT }, () => ({
        target: null as Card | null,
        grow: 0,
        path: el('path', 'silk', silksG)
    }));

    const build = () => {
        const W = web.clientWidth,
            H = web.clientHeight;
        const cx = W / 2,
            cy = H / 2;
        const ryF = H / 2 - 26;
        const inner = { rx: Math.min(W / 2 - 22, ryF * 1.75) - 125, ry: ryF - 44 };
        const stars = layout(W, H, inner);
        for (const g of [orbitsG, threadsG, pulsesG, labelsG]) g.innerHTML = '';
        pulses = [];
        cards = stars.map((star, i) => ({
            star,
            el: els.find((c) => c.dataset.id === star.p.id)!,
            clock: i * 1700,
            speed: 1,
            hold: false,
            x: star.x,
            y: star.y,
            delay: 0
        }));

        // Orbits: one loop per period through its cards; wide gaps get points on the ideal ellipse so the loop stays round
        orbits = PERIODS.map(({ key, label, r }, ring) => {
            const own = byAngle(
                cards.filter((c) => yearOf(c.star.p) === key),
                cx,
                cy
            );
            const mean =
                own.reduce((s, c) => s + Math.hypot((c.x - cx) / inner.rx, (c.y - cy) / inner.ry), 0) / own.length || r;
            const ang = own.map((c) => Math.atan2((c.y - cy) / inner.ry, (c.x - cx) / inner.rx));
            const gaps: Pt[] = [];
            let widest = { size: 0, mid: -Math.PI / 2 };
            ang.forEach((a, i) => {
                const next = i + 1 < ang.length ? ang[i + 1] : ang[0] + Math.PI * 2;
                const size = next - a,
                    fill = Math.max(0, Math.ceil(size / 0.6) - 1);
                for (let k = 1; k <= fill; k++) {
                    const t = a + (size * k) / (fill + 1);
                    gaps.push({ x: cx + Math.cos(t) * inner.rx * mean, y: cy + Math.sin(t) * inner.ry * mean });
                }
                if (size > widest.size) widest = { size, mid: a + size / 2 };
            });
            const text = el('text', 'orbit-label', labelsG);
            text.textContent = label;
            text.setAttribute('x', f1(cx + Math.cos(widest.mid) * inner.rx * mean));
            text.setAttribute('y', f1(cy + Math.sin(widest.mid) * inner.ry * mean + 3.5));
            text.style.setProperty('--d', `${250 + ring * 380}ms`);
            // A plate behind the label so the loop never runs through the letters
            const box = text.getBBox(),
                plate = el('rect', 'orbit-plate', labelsG);
            labelsG.insertBefore(plate, text);
            plate.setAttribute('x', f1(box.x - 8));
            plate.setAttribute('y', f1(box.y - 3));
            plate.setAttribute('width', f1(box.width + 16));
            plate.setAttribute('height', f1(box.height + 6));
            plate.setAttribute('rx', '4');
            plate.style.setProperty('--d', `${250 + ring * 380}ms`);
            own.forEach((c, i) => (c.delay = 330 + ring * 380 + i * 45));
            const path = el('path', 'orbit', orbitsG);
            path.setAttribute('pathLength', '1');
            path.style.setProperty('--d', `${120 + ring * 380}ms`);
            return { cards: own, gaps, order: byAngle<Card | Pt>([...own, ...gaps], cx, cy), path };
        });
        cards.forEach((c) => c.el.style.setProperty('--d', `${c.delay}ms`));

        // The web: each project to its 2 most similar, deduplicated; drawn in once both ends are in
        const byId = new Map(cards.map((c) => [c.star.p.id, c]));
        const seen = new Set<string>();
        threads = [];
        for (const c of cards)
            for (const { q, s } of neighbours(c.star.p).slice(0, 2)) {
                const key = c.star.p.id < q.id ? `${c.star.p.id}|${q.id}` : `${q.id}|${c.star.p.id}`;
                if (seen.has(key)) continue;
                seen.add(key);
                const b = byId.get(q.id)!;
                const path = el('path', 'thread', threadsG);
                path.setAttribute('pathLength', '1');
                path.style.setProperty('--d', `${Math.max(c.delay, b.delay) + 250}ms`);
                threads.push({ a: c, b, s, path, pluckAt: -1e9, pluckDir: 0, off: 0 });
            }
        now.style.left = `${cx}px`;
        now.style.top = `${cy}px`;
    };

    // Boot once, the first time most of the web is on screen
    let visible = false,
        bootEnd = Infinity;
    const boot = (t: number) => {
        if (bootEnd !== Infinity) return;
        if (reduceMotion()) {
            web.classList.add('booted');
            bootEnd = t;
            return;
        }
        web.classList.add('booting', 'booted');
        bootEnd = t + 2400;
        setTimeout(() => web.classList.remove('booting'), 2600);
    };
    new IntersectionObserver(
        ([e]) => {
            visible = e.isIntersecting;
            if (visible) boot(performance.now());
        },
        { threshold: 0.35 }
    ).observe(web);

    // Cursor
    let pointer: Pt | null = null,
        prev: Pt | null = null;
    const smooth: Pt = { x: 0, y: 0 };
    web.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const r = web.getBoundingClientRect();
        const p = { x: e.clientX - r.left, y: e.clientY - r.top };
        if (!pointer) Object.assign(smooth, p);
        prev = pointer;
        pointer = p;
        if (!prev || reduceMotion()) return;
        const t = performance.now();
        for (const th of threads) {
            if (t - th.pluckAt < 450) continue;
            const dir = crossing(prev, pointer, th.a, th.b);
            if (dir) {
                th.pluckAt = t;
                th.pluckDir = dir;
            }
        }
    });
    web.addEventListener('pointerleave', () => {
        pointer = prev = null;
    });

    // One thought at a time: a pulse walks a few hops through similar projects
    let nextThought = 0;
    let born: Pulse[] = []; // spawned this frame, merged after the update pass
    const fire = (from: Card, th: Thread, t: number, hops: number) => {
        const to = th.a === from ? th.b : th.a;
        const dot = el('circle', 'pulse', pulsesG);
        dot.setAttribute('r', '2.4');
        th.path.classList.add('live');
        born.push({ th, from, t0: t, dur: 380 + Math.hypot(to.x - from.x, to.y - from.y) * 2.4, hops, dot });
    };
    const flash = (c: Card) => {
        c.el.classList.add('fire');
        setTimeout(() => c.el.classList.remove('fire'), 420);
    };
    const pulseStep = (t: number) => {
        if (!opened && !pulses.length && !born.length && t > Math.max(nextThought, bootEnd + 500)) {
            const start = cards[Math.floor(Math.random() * cards.length)];
            const out = threads.filter((th) => th.a === start || th.b === start);
            if (out.length)
                fire(start, out[Math.floor(Math.random() * out.length)], t, 1 + Math.floor(Math.random() * 3));
            flash(start);
        }
        pulses = pulses.filter((p) => {
            const u = Math.max(0, (t - p.t0) / p.dur);
            const to = p.th.a === p.from ? p.th.b : p.th.a;
            if (u < 1) {
                const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2; // ease in-out: leaves, travels, settles
                const pt = along(p.th.a, p.th.b, 0.07, p.th.off, p.th.a === p.from ? e : 1 - e);
                p.dot.setAttribute('cx', f1(pt.x));
                p.dot.setAttribute('cy', f1(pt.y));
                return true;
            }
            p.dot.remove();
            p.th.path.classList.remove('live');
            flash(to);
            const next = threads.filter((th) => th !== p.th && (th.a === to || th.b === to));
            if (p.hops > 0 && !opened && next.length)
                fire(to, next[Math.floor(Math.random() * next.length)], t + 120, p.hops - 1);
            else if (p.hops >= 0) nextThought = t + 1800 + Math.random() * 1600;
            return false;
        });
        pulses.push(...born);
        born = [];
    };

    const drawSilk = (frozen: boolean) => {
        const active = pointer && !opened;
        if (pointer) {
            smooth.x += (pointer.x - smooth.x) * (frozen ? 1 : 0.28);
            smooth.y += (pointer.y - smooth.y) * (frozen ? 1 : 0.28);
        }
        const near = new Set<Card>();
        if (active)
            for (let k = 0; k < SILK_COUNT; k++) {
                let best: Card | null = null,
                    bestD = SILK_REACH;
                for (const c of cards) {
                    const d = Math.hypot(c.x - smooth.x, c.y - smooth.y);
                    if (d < bestD && !near.has(c)) {
                        best = c;
                        bestD = d;
                    }
                }
                if (best) near.add(best);
            }
        for (const s of silks) if (s.target && !near.has(s.target)) s.target = null;
        for (const c of near)
            if (!silks.some((s) => s.target === c)) {
                const free = silks.find((s) => !s.target)!;
                free.target = c;
                free.grow = frozen ? 1 : 0;
            }
        for (const s of silks) {
            if (!s.target) {
                s.path.style.opacity = '0';
                continue;
            }
            s.grow += (1 - s.grow) * 0.14;
            const end = {
                x: smooth.x + (s.target.x - smooth.x) * s.grow,
                y: smooth.y + (s.target.y - smooth.y) * s.grow
            };
            const dist = Math.hypot(s.target.x - smooth.x, s.target.y - smooth.y);
            s.path.setAttribute('d', silk(smooth, end, 0.05));
            s.path.style.opacity = String(Math.max(0, 1 - dist / SILK_REACH) * 0.9);
        }
        spinneret.setAttribute('cx', f1(smooth.x));
        spinneret.setAttribute('cy', f1(smooth.y));
        spinneret.style.opacity = active && near.size ? '1' : '0';
    };

    let last = performance.now();
    const frame = (t: number) => {
        if (!web.isConnected) return;
        const dt = Math.min(50, t - last);
        last = t;
        if (visible) {
            const frozen = reduceMotion();
            for (const c of cards) {
                c.speed += ((c.hold || frozen ? 0 : 1) - c.speed) * 0.08;
                c.clock += dt * c.speed;
                const k = c.clock / 1000,
                    ph = c.star.phase;
                c.x = c.star.x + Math.sin(k * 0.68 + ph) * 8 + Math.sin(k * 0.41 + ph * 1.7) * 4;
                c.y = c.star.y + Math.cos(k * 0.55 + ph) * 6 + Math.sin(k * 0.39 + ph * 0.6) * 3;
                c.el.style.setProperty('--x', `${c.x}px`);
                c.el.style.setProperty('--y', `${c.y}px`);
            }
            for (const o of orbits) if (o.order.length > 2) o.path.setAttribute('d', loop(o.order)); // the loops follow their drifting cards
            for (const th of threads) {
                const age = (t - th.pluckAt) / 1000;
                th.off = age < 0.7 ? th.pluckDir * 7 * Math.sin(age * Math.PI * 2 * 5.5) * Math.exp(-age / 0.17) : 0;
                th.path.setAttribute('d', silk(th.a, th.b, 0.07, th.off));
            }
            if (!frozen) pulseStep(t);
            drawSilk(frozen);
        }
        requestAnimationFrame(frame);
    };

    // Unfold in place (as round 6/7); an unfolded card sends one signal to each similar project
    let opened: Card | null = null;
    const mark = (c: Card, on: boolean) => {
        for (const th of threads) {
            if (th.a !== c && th.b !== c) continue;
            th.path.classList.toggle('hot', on);
            const other = (th.a === c ? th.b : th.a).el;
            other.classList.toggle('near', on);
            if (on) other.dataset.score = `${th.s.toFixed(2)} similar`;
            else delete other.dataset.score;
        }
    };
    const open = (c: Card) => {
        if (opened && opened !== c) close(opened);
        opened = c;
        c.hold = true;
        const W = web.clientWidth,
            H = web.clientHeight;
        c.el.dataset.dir = c.star.y > H * 0.58 ? 'up' : 'down';
        const overflow = Math.max(0, c.star.x + OPEN_W / 2 + 16 - W) - Math.max(0, OPEN_W / 2 + 16 - c.star.x);
        c.el.style.setProperty('--dx', `${-overflow}px`);
        c.el.classList.add('open');
        web.classList.add('focus');
        mark(c, true);
        if (!reduceMotion()) {
            const t = performance.now();
            for (const th of threads) if (th.a === c || th.b === c) fire(c, th, t + 200, -1);
        }
    };
    const close = (c: Card) => {
        c.hold = false;
        c.el.classList.remove('open');
        mark(c, false);
        if (opened === c) {
            opened = null;
            web.classList.remove('focus');
        }
    };

    let timer = 0;
    const later = (fn: () => void, ms: number) => {
        clearTimeout(timer);
        timer = window.setTimeout(fn, ms);
    };
    els.forEach((a) => {
        const card = () => cards.find((c) => c.el === a)!;
        a.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'touch') return;
            card().hold = true;
            later(() => open(card()), 120);
        });
        a.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'touch') return;
            later(() => close(card()), 160);
        });
        a.addEventListener('focus', () => open(card()));
        a.addEventListener('blur', () => close(card()));
        a.addEventListener('click', (e) => {
            if (!a.classList.contains('open')) {
                e.preventDefault();
                open(card());
            }
        });
    });
    window.addEventListener('keydown', (e) => e.key === 'Escape' && opened && close(opened));
    document.addEventListener('pointerdown', (e) => opened && !opened.el.contains(e.target as Node) && close(opened));

    build();
    window.addEventListener('resize', build);
    requestAnimationFrame(frame);

    return (domain: string) => {
        web.classList.toggle('dim-domain', domain !== 'all');
        els.forEach((c) => c.classList.toggle('in-domain', c.dataset.domain === domain));
    };
}

export const variantK = (root: HTMLElement) => variantF(root, (host) => mountOrbits(host), 'Web', true);
