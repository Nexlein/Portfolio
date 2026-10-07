// PROTOTYPE — Round 7 (J) "silk": a real web. Inner threads join each project to its 2 most similar ones,
// outer cards tie to the board's frame, threads sag like silk and get plucked when the cursor crosses them.
// The cursor spins silk to its nearest cards (like a nearest-neighbour query). The centre is "Now":
// recent work sits closest to it, older work further out.
import './web.css';
import './silk.css';
import { EXPERIENCES } from '@/data/profile';
import { PROJECTS, projectPath, type ProjectEntry } from '@/data/projects';
import { oneLiner, still } from './round2';
import { variantF } from './round3';
import { ICONS, layout, neighbours, yearOf, type Star } from './space';

const SVG = 'http://www.w3.org/2000/svg';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const OPEN_W = 330;
const SILK_REACH = 340; // cursor silk only reaches cards this close
const SILK_COUNT = 3;

interface Pt {
    x: number;
    y: number;
}

interface Card extends Pt {
    star: Star;
    el: HTMLAnchorElement;
    clock: number; // each card keeps its own time, so only the hovered one stops
    speed: number;
    hold: boolean;
}

interface Thread {
    kind: 'sim' | 'frame';
    a: Card;
    b: Card | null; // null: tied to the frame at `anchor`
    anchor: Pt;
    s: number;
    path: SVGPathElement;
    pluckAt: number;
    pluckDir: number;
}

interface Silk {
    target: Card | null;
    grow: number;
    path: SVGPathElement;
}

function seeded(seed: number): () => number {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, cls: string, parent: Element): SVGElementTagNameMap[K] {
    const node = document.createElementNS(SVG, tag);
    node.setAttribute('class', cls);
    parent.appendChild(node);
    return node;
}

/** Side of segment p1→p2 the cursor ended on, if it crossed a→b; 0 if it did not cross. */
function crossing(p1: Pt, p2: Pt, a: Pt, b: Pt): number {
    const side = (o: Pt, e: Pt, p: Pt) => (e.x - o.x) * (p.y - o.y) - (e.y - o.y) * (p.x - o.x);
    const d1 = side(a, b, p1),
        d2 = side(a, b, p2);
    return d1 * d2 < 0 && side(p1, p2, a) * side(p1, p2, b) < 0 ? Math.sign(d2) : 0;
}

/** Quadratic silk from a to b: sags under gravity, plus a sideways offset (pluck). */
function silk(a: Pt, b: Pt, sag: number, off = 0): string {
    const dx = b.x - a.x,
        dy = b.y - a.y,
        len = Math.hypot(dx, dy) || 1;
    const cx = (a.x + b.x) / 2 + (-dy / len) * off,
        cy = (a.y + b.y) / 2 + len * sag + (dx / len) * off;
    return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** Frame anchors: a card close to a wall ties to it, slanted away from the centre like a web's radial threads. */
function frameAnchors(star: Star, i: number, W: number, H: number): Pt[] {
    const rnd = seeded(131 + i * 17);
    const cx = W / 2,
        cy = H / 2,
        reach = 260;
    const slant = (v: number, c: number, max: number) =>
        Math.min(max - 8, Math.max(8, v + (v - c) * 0.45 + (rnd() - 0.5) * 60));
    const out: Pt[] = [];
    if (star.x < reach) out.push({ x: -2, y: slant(star.y, cy, H) });
    if (W - star.x < reach) out.push({ x: W + 2, y: slant(star.y, cy, H) });
    if (star.y < reach * 0.8) out.push({ x: slant(star.x, cx, W), y: -2 });
    if (H - star.y < reach * 0.8) out.push({ x: slant(star.x, cx, W), y: H + 2 });
    return out.slice(0, 2);
}

function cardHtml(p: ProjectEntry): string {
    return `<a class="vi-card" href="${projectPath(p.id)}" data-id="${p.id}" data-domain="${p.category}">
<span class="head"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[p.category]}</svg></span>
<span class="txt"><strong>${p.title}</strong><span class="mono">${yearOf(p)} · ${p.tags[0]}</span></span></span>
<span class="more"><span class="inner">
  <span class="media"><img src="${still(p)}" alt="" loading="lazy" /></span>
  <span class="line">${oneLiner(p)}</span>
  <span class="mono skills">${p.tags.slice(0, 4).join(' · ')}</span>
  <span class="go">Open project <span aria-hidden="true">→</span></span>
</span></span></a>`;
}

function nowHtml(): string {
    const job = EXPERIENCES[0];
    // Real build: a dedicated `now` entry in profile.ts instead of this hand-written line
    return `<div class="vj-now">
<span class="mono eyebrow"><span class="live" aria-hidden="true"></span>Now</span>
<strong>${job.title.en.replace(' (Part-Time)', '')} at ${job.org}</strong>
<span class="line">RAG pipelines and conversational agents</span>
<span class="mono sub">${job.period.en} · Epitech year 3</span>
</div>`;
}

export function mountSilk(host: HTMLElement): (domain: string) => void {
    host.innerHTML = `<div class="vi-web vj-web" aria-label="Projects on a web: threads join similar projects, recent work sits near the centre. Hover or focus a project to unfold it; select it to open its page.">
<svg><g class="rings"></g><g class="threads"></g><g class="silks"></g></svg>
${nowHtml()}
${PROJECTS.map(cardHtml).join('')}
<p class="vi-legend mono">closer to the centre = more recent · threads join similar projects · hover to unfold</p></div>`;

    const web = host.querySelector<HTMLElement>('.vj-web')!;
    const svg = web.querySelector('svg')!;
    const ringsG = svg.querySelector('.rings')!;
    const threadsG = svg.querySelector('.threads')!;
    const silksG = svg.querySelector('.silks')!;
    const now = web.querySelector<HTMLElement>('.vj-now')!;
    const els = [...web.querySelectorAll<HTMLAnchorElement>('.vi-card')];

    let cards: Card[] = [];
    let threads: Thread[] = [];
    const spinneret = el('circle', 'spinneret', silksG);
    spinneret.setAttribute('r', '2.4');
    const silks: Silk[] = Array.from({ length: SILK_COUNT }, () => ({
        target: null,
        grow: 0,
        path: el('path', 'silk', silksG)
    }));

    const build = () => {
        const W = web.clientWidth,
            H = web.clientHeight;
        const stars = layout(W, H);
        threadsG.innerHTML = '';
        ringsG.innerHTML = '';
        cards = stars.map((star, i) => ({
            star,
            el: els.find((c) => c.dataset.id === star.p.id)!,
            clock: i * 1700,
            speed: 1,
            hold: false,
            x: star.x,
            y: star.y
        }));
        const byId = new Map(cards.map((c) => [c.star.p.id, c]));

        // Inner web: each project to its 2 most similar, deduplicated
        const seen = new Set<string>();
        threads = [];
        for (const c of cards)
            for (const { q, s } of neighbours(c.star.p).slice(0, 2)) {
                const key = c.star.p.id < q.id ? `${c.star.p.id}|${q.id}` : `${q.id}|${c.star.p.id}`;
                if (seen.has(key)) continue;
                seen.add(key);
                threads.push({
                    kind: 'sim',
                    a: c,
                    b: byId.get(q.id)!,
                    anchor: { x: 0, y: 0 },
                    s,
                    path: el('path', 'thread', threadsG),
                    pluckAt: -1e9,
                    pluckDir: 0
                });
            }
        // Frame: outer cards tie to the walls
        cards.forEach((c, i) => {
            for (const anchor of frameAnchors(c.star, i, W, H))
                threads.push({
                    kind: 'frame',
                    a: c,
                    b: null,
                    anchor,
                    s: 0,
                    path: el('path', 'thread frame', threadsG),
                    pluckAt: -1e9,
                    pluckDir: 0
                });
        });

        // Time rings around "Now": boundaries between Personal / Tek2 / Tek1 orbits
        for (const r of [0.54, 0.81]) {
            const e = el('ellipse', 'ring', ringsG);
            e.setAttribute('cx', String(W / 2));
            e.setAttribute('cy', String(H / 2));
            e.setAttribute('rx', String(W * 0.44 * r));
            e.setAttribute('ry', String(H * 0.47 * r));
        }
        now.style.left = `${W / 2}px`;
        now.style.top = `${H / 2}px`;
    };

    // Cursor: raw position for pluck detection, smoothed position for the elastic silk
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
            const dir = crossing(prev, pointer, th.a, th.b ?? th.anchor);
            if (dir) {
                th.pluckAt = t;
                th.pluckDir = dir;
            }
        }
    });
    web.addEventListener('pointerleave', () => {
        pointer = prev = null;
    });

    let visible = true,
        last = performance.now();
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(web);

    const frame = (t: number) => {
        if (!web.isConnected) return;
        const dt = Math.min(50, t - last);
        last = t;
        if (visible) {
            const frozen = reduceMotion();
            for (const c of cards) {
                c.speed += ((c.hold || frozen ? 0 : 1) - c.speed) * 0.08; // ease to a stop, ease back
                c.clock += dt * c.speed;
                const k = c.clock / 1000,
                    ph = c.star.phase;
                c.x = c.star.x + Math.sin(k * 0.68 + ph) * 8 + Math.sin(k * 0.41 + ph * 1.7) * 4;
                c.y = c.star.y + Math.cos(k * 0.55 + ph) * 6 + Math.sin(k * 0.39 + ph * 0.6) * 3;
                c.el.style.setProperty('--x', `${c.x}px`);
                c.el.style.setProperty('--y', `${c.y}px`);
            }
            for (const th of threads) {
                const age = (t - th.pluckAt) / 1000;
                // Pluck: a damped vibration, gone in ~0.6 s
                const off = age < 0.7 ? th.pluckDir * 7 * Math.sin(age * Math.PI * 2 * 5.5) * Math.exp(-age / 0.17) : 0;
                th.path.setAttribute('d', silk(th.a, th.b ?? th.anchor, th.kind === 'sim' ? 0.07 : 0.035, off));
            }
            drawSilk(frozen);
        }
        requestAnimationFrame(frame);
    };

    // Cursor silk: up to 3 threads to the nearest cards; a new target makes the thread shoot out again
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
        spinneret.setAttribute('cx', smooth.x.toFixed(1));
        spinneret.setAttribute('cy', smooth.y.toFixed(1));
        spinneret.style.opacity = active && near.size ? '1' : '0';
    };

    // Unfold in place, toward the free side, with hover intent so brushing past does nothing
    let opened: Card | null = null;
    const mark = (c: Card, on: boolean) => {
        for (const th of threads) {
            if (th.kind !== 'sim' || (th.a !== c && th.b !== c)) continue;
            th.path.classList.toggle('hot', on);
            const other = (th.a === c ? th.b : th.a)!.el;
            other.classList.toggle('near', on);
            // Similarity on the neighbour itself: thread midpoints often sit under a card
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
            card().hold = true; // stop drifting under the cursor right away
            later(() => open(card()), 120);
        });
        a.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'touch') return;
            later(() => close(card()), 160);
        });
        a.addEventListener('focus', () => open(card()));
        a.addEventListener('blur', () => close(card()));
        // Touch: first tap unfolds, second tap opens the page
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

export const variantJ = (root: HTMLElement) => variantF(root, (host) => mountSilk(host), 'Web', true);
