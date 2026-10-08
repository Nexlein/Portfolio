// PROTOTYPE — Round 10 (M) "neural map": the round 9 layout and motion, restyled from spider web to neural network.
// - Synapses: gentle arcs (no sag) whose width and brightness are the similarity weight, plugged into ports on the cards.
// - Hidden neurons: a faint latent layer of small units between the projects, sparsely wired.
// - Spreading activation: a thought starts at one project and spreads to all its neighbours, weaker at each step;
//   cards glow with their activation, hidden neurons near a passing signal light up.
// - The cursor is an input: hidden neurons around it activate, attention lines reach the 3 nearest projects.
// - Period rings are faint dotted layers. Motion is round 9's living web (breeze + springs + pushes).
import './web.css';
import './silk.css';
import './brain.css';
import { EXPERIENCES } from '@/data/profile';
import { PROJECTS, projectPath, type ProjectEntry } from '@/data/projects';
import { oneLiner, still } from './round2';
import { variantF } from './round3';
import { ICONS, layout, neighbours, yearOf, type Star } from './space';

const SVG = 'http://www.w3.org/2000/svg';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const OPEN_W = 330;
const HALF_W = 95,
    HALF_H = 26; // card half size, for ports
const ATTN_REACH = 340;
const NEURONS = 72;

const PERIODS = [
    { key: 'Personal', label: 'personal · 2025–26', r: 0.4 },
    { key: 'Tek2', label: 'tek 2 · 2025–26', r: 0.68 },
    { key: 'Tek1', label: 'tek 1 · 2024–25', r: 0.94 }
] as const;
const SUB: Record<string, string> = { Personal: 'personal', Tek2: 'tek 2', Tek1: 'tek 1' };

interface Pt {
    x: number;
    y: number;
}

interface Card extends Pt {
    star: Star;
    el: HTMLAnchorElement;
    hold: boolean;
    delay: number;
    ox: number;
    oy: number;
    vx: number;
    vy: number;
    act: number; // activation 0..1, shown as a glow
    shown: number; // last activation written to the DOM
}

interface Synapse {
    a: Card;
    b: Card;
    s: number;
    bend: number;
    path: SVGPathElement;
    pa: SVGCircleElement;
    pb: SVGCircleElement;
    geo: { p: Pt; q: Pt; c: Pt }; // this frame's endpoints and control point
}

interface Neuron extends Pt {
    x0: number;
    y0: number;
    act: number;
    dot: SVGCircleElement;
}

interface Wire {
    n: Neuron;
    m: Neuron | Card;
    line: SVGLineElement;
}

interface Signal {
    syn: Synapse;
    from: Card;
    t0: number;
    dur: number;
    strength: number;
    visited: Set<Card>;
    head: SVGCircleElement;
    tail: SVGLineElement;
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, cls: string, parent: Element): SVGElementTagNameMap[K] {
    const node = document.createElementNS(SVG, tag);
    node.setAttribute('class', cls);
    parent.appendChild(node);
    return node;
}

const f1 = (n: number) => n.toFixed(1);

function seeded(seed: number): () => number {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** Where the line from a card's centre toward `to` leaves the card: the port. */
function port(c: Pt, to: Pt): Pt {
    const dx = to.x - c.x,
        dy = to.y - c.y;
    const t = Math.min(HALF_W / (Math.abs(dx) || 1e-6), HALF_H / (Math.abs(dy) || 1e-6));
    return { x: c.x + dx * Math.min(t, 1), y: c.y + dy * Math.min(t, 1) };
}

function quad(p: Pt, c: Pt, q: Pt, u: number): Pt {
    const v = 1 - u;
    return { x: v * v * p.x + 2 * u * v * c.x + u * u * q.x, y: v * v * p.y + 2 * u * v * c.y + u * u * q.y };
}

/** Slow breeze: two long travelling waves, so nearby things lean the same way. */
function breeze(x: number, y: number, s: number): Pt {
    return {
        x: 35 * Math.sin(0.0042 * x - 0.0026 * y + 0.42 * s) + 18 * Math.sin(0.0019 * x + 0.0047 * y + 0.27 * s + 1.3),
        y: 27 * Math.cos(0.0035 * x + 0.0039 * y + 0.36 * s) + 14 * Math.sin(-0.0024 * x + 0.0051 * y + 0.23 * s + 0.7)
    };
}

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

export function mountBrain(host: HTMLElement): (domain: string) => void {
    host.innerHTML = `<div class="vi-web vj-web vm-web" aria-label="Projects as a network: the most recent closest to the centre, links join projects that share skills (brighter = more similar). Hover or focus a project to preview it; select it to open its page.">
<svg><g class="layers"></g><g class="wires"></g><g class="neurons"></g><g class="syns"></g><g class="signals"></g><g class="attn"></g><g class="labels"></g></svg>
${nowHtml()}
${PROJECTS.map(cardHtml).join('')}
<p class="vi-legend mono">links = shared skills · brighter = more similar · hover to preview · click to open</p></div>`;

    const web = host.querySelector<HTMLElement>('.vm-web')!;
    const svg = web.querySelector('svg')!;
    const g = (c: string) => svg.querySelector(`.${c}`)!;
    const [layersG, wiresG, neuronsG, synsG, signalsG, attnG, labelsG] = [
        'layers',
        'wires',
        'neurons',
        'syns',
        'signals',
        'attn',
        'labels'
    ].map(g);
    const now = web.querySelector<HTMLElement>('.vj-now')!;
    const els = [...web.querySelectorAll<HTMLAnchorElement>('.vi-card')];

    let cards: Card[] = [],
        syns: Synapse[] = [],
        neurons: Neuron[] = [],
        wires: Wire[] = [],
        signals: Signal[] = [];
    const attn = Array.from({ length: 3 }, () => el('line', 'attn-line', attnG));

    const build = () => {
        const W = web.clientWidth,
            H = web.clientHeight;
        if (W < 400) return; // hidden (phones get a list instead)
        const cx = W / 2,
            cy = H / 2;
        const ryF = H / 2 - 26;
        const inner = { rx: Math.min(W / 2 - 22, ryF * 1.75) - 125, ry: ryF - 44 };
        const stars = layout(W, H, inner);
        for (const grp of [layersG, wiresG, neuronsG, synsG, signalsG, labelsG]) grp.innerHTML = '';
        signals = [];
        cards = stars.map((star) => ({
            star,
            el: els.find((c) => c.dataset.id === star.p.id)!,
            hold: false,
            delay: 0,
            x: star.x,
            y: star.y,
            ox: 0,
            oy: 0,
            vx: 0,
            vy: 0,
            act: 0,
            shown: -1
        }));

        // Layers: one dotted ellipse per period, labelled in its widest gap
        PERIODS.forEach(({ key, label, r }, ring) => {
            const own = cards.filter((c) => yearOf(c.star.p) === key);
            const ang = own.map((c) => Math.atan2((c.y - cy) / inner.ry, (c.x - cx) / inner.rx));
            let best = { gap: -1, mid: -Math.PI / 2 };
            for (let k = 0; k < 48; k++) {
                const a = -Math.PI + (k / 48) * Math.PI * 2;
                const gap = Math.min(
                    ...ang.map((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))),
                    Math.PI
                );
                if (gap > best.gap) best = { gap, mid: a };
            }
            const e = el('ellipse', 'layer', layersG);
            e.setAttribute('cx', f1(cx));
            e.setAttribute('cy', f1(cy));
            e.setAttribute('rx', f1(inner.rx * r));
            e.setAttribute('ry', f1(inner.ry * r));
            e.style.setProperty('--d', `${100 + ring * 300}ms`);
            const text = el('text', 'layer-label', labelsG);
            text.textContent = label;
            text.setAttribute('x', f1(cx + Math.cos(best.mid) * inner.rx * r));
            text.setAttribute('y', f1(cy + Math.sin(best.mid) * inner.ry * r + 3.5));
            const box = text.getBBox(),
                plate = el('rect', 'layer-plate', labelsG);
            labelsG.insertBefore(plate, text);
            plate.setAttribute('x', f1(box.x - 8));
            plate.setAttribute('y', f1(box.y - 3));
            plate.setAttribute('width', f1(box.width + 16));
            plate.setAttribute('height', f1(box.height + 6));
            plate.setAttribute('rx', '4');
            for (const n of [text, plate]) n.style.setProperty('--d', `${250 + ring * 300}ms`);
            own.forEach((c, i) => (c.delay = 380 + ring * 300 + i * 45));
        });
        cards.forEach((c) => c.el.style.setProperty('--d', `${c.delay}ms`));

        // Synapses: each project to its 2 most similar, deduplicated
        const byId = new Map(cards.map((c) => [c.star.p.id, c]));
        const seen = new Set<string>();
        syns = [];
        for (const c of cards)
            for (const { q, s } of neighbours(c.star.p).slice(0, 2)) {
                const key = c.star.p.id < q.id ? `${c.star.p.id}|${q.id}` : `${q.id}|${c.star.p.id}`;
                if (seen.has(key)) continue;
                seen.add(key);
                const b = byId.get(q.id)!;
                const path = el('path', 'syn', synsG);
                path.setAttribute('pathLength', '1');
                path.style.setProperty('--w', String(s));
                path.style.setProperty('--d', `${Math.max(c.delay, b.delay) + 250}ms`);
                const pa = el('circle', 'port', synsG),
                    pb = el('circle', 'port', synsG);
                for (const pt of [pa, pb]) {
                    pt.setAttribute('r', '2.2');
                    pt.style.setProperty('--d', `${Math.max(c.delay, b.delay) + 250}ms`);
                }
                syns.push({
                    a: c,
                    b,
                    s,
                    bend: (syns.length % 2 ? 1 : -1) * 0.12,
                    path,
                    pa,
                    pb,
                    geo: { p: c, q: b, c }
                });
            }

        // Hidden neurons: seeded, inside the outer layer, clear of cards and of "Now"
        const rnd = seeded(4242);
        const fx = inner.rx + 70,
            fy = inner.ry + 20;
        neurons = [];
        for (let tries = 0; neurons.length < NEURONS && tries < 4000; tries++) {
            const x = cx + (rnd() * 2 - 1) * fx,
                y = cy + (rnd() * 2 - 1) * fy;
            if (Math.hypot((x - cx) / fx, (y - cy) / fy) > 1) continue;
            if (Math.abs(x - cx) < 170 && Math.abs(y - cy) < 62) continue;
            if (cards.some((c) => Math.abs(x - c.x) < HALF_W + 14 && Math.abs(y - c.y) < HALF_H + 14)) continue;
            if (neurons.some((n) => Math.hypot(n.x0 - x, n.y0 - y) < 34)) continue;
            const dot = el('circle', 'neuron', neuronsG);
            dot.style.setProperty('--d', `${Math.round(rnd() * 500)}ms`);
            neurons.push({ x0: x, y0: y, x, y, act: 0, dot });
        }
        // Sparse wiring: each neuron to its 2 nearest neurons, and to a project if one is close
        wires = [];
        const wired = new Set<string>();
        neurons.forEach((n, i) => {
            const near = neurons
                .map((m, j) => ({ j, d: Math.hypot(m.x0 - n.x0, m.y0 - n.y0) }))
                .filter(({ j, d }) => j !== i && d < 150);
            for (let k = 0; k < 2 && near.length; k++) {
                const best = near.reduce((a, b) => (b.d < a.d ? b : a));
                near.splice(near.indexOf(best), 1);
                const key = i < best.j ? `${i}|${best.j}` : `${best.j}|${i}`;
                if (wired.has(key)) continue;
                wired.add(key);
                wires.push({ n, m: neurons[best.j], line: el('line', 'wire', wiresG) });
            }
            const card = cards.find((c) => Math.hypot(c.x - n.x0, c.y - n.y0) < 150);
            if (card) wires.push({ n, m: card, line: el('line', 'wire', wiresG) });
        });

        now.style.left = `${cx}px`;
        now.style.top = `${cy}px`;
    };

    // Boot once, the first time most of the map is on screen
    let visible = false,
        bootEnd = Infinity;
    const boot = (t: number) => {
        if (bootEnd !== Infinity) return;
        web.classList.add('booted');
        if (reduceMotion()) {
            bootEnd = t;
            return;
        }
        web.classList.add('booting');
        bootEnd = t + 2300;
        setTimeout(() => web.classList.remove('booting'), 2500);
    };
    new IntersectionObserver(
        ([e]) => {
            visible = e.isIntersecting;
            if (visible) boot(performance.now());
        },
        { threshold: 0.35 }
    ).observe(web);

    let pointer: Pt | null = null;
    web.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const r = web.getBoundingClientRect();
        pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    web.addEventListener('pointerleave', () => (pointer = null));

    // Attention: the 3 nearest projects to the cursor, weighted by distance
    let attended: { c: Card; w: number }[] = [];
    const drawAttention = () => {
        attended = [];
        if (pointer && !opened) {
            const pool = cards.map((c) => ({ c, d: Math.hypot(c.x - pointer!.x, c.y - pointer!.y) }));
            for (let k = 0; k < 3; k++) {
                const best = pool.reduce((a, b) => (b.d < a.d ? b : a));
                pool.splice(pool.indexOf(best), 1);
                if (best.d < ATTN_REACH) attended.push({ c: best.c, w: 1 - best.d / ATTN_REACH });
            }
        }
        attn.forEach((line, k) => {
            const a = attended[k];
            if (!a || !pointer) {
                line.style.opacity = '0';
                return;
            }
            const p = port(a.c, pointer);
            line.setAttribute('x1', f1(pointer.x));
            line.setAttribute('y1', f1(pointer.y));
            line.setAttribute('x2', f1(p.x));
            line.setAttribute('y2', f1(p.y));
            line.style.opacity = String(a.w * 0.85);
        });
    };

    // Living web (round 9): rest springs, breeze, synapses as soft springs, pushes from events
    const K = 6,
        DAMP = 2.4,
        LINK = 3;
    const physics = (dt: number, s: number) => {
        const h = Math.min(dt, 34) / 1000;
        const f = new Map<Card, Pt>();
        for (const c of cards) {
            const w = breeze(c.star.x, c.star.y, s);
            f.set(c, { x: w.x - K * c.ox - DAMP * c.vx, y: w.y - K * c.oy - DAMP * c.vy });
        }
        for (const sy of syns) {
            const dx = (sy.b.ox - sy.a.ox) * LINK,
                dy = (sy.b.oy - sy.a.oy) * LINK;
            f.get(sy.a)!.x += dx;
            f.get(sy.a)!.y += dy;
            f.get(sy.b)!.x -= dx;
            f.get(sy.b)!.y -= dy;
        }
        for (const { c, w } of attended) {
            const dx = pointer!.x - c.x,
                dy = pointer!.y - c.y,
                d = Math.hypot(dx, dy) || 1;
            f.get(c)!.x += (dx / d) * 18 * w;
            f.get(c)!.y += (dy / d) * 18 * w;
        }
        for (const c of cards) {
            if (c.hold) c.vx = c.vy = 0;
            else {
                c.vx += f.get(c)!.x * h;
                c.vy += f.get(c)!.y * h;
                c.ox += c.vx * h;
                c.oy += c.vy * h;
            }
        }
    };

    // Spreading activation
    let nextThought = 0;
    const fire = (from: Card, syn: Synapse, t: number, strength: number, visited: Set<Card>) => {
        const head = el('circle', 'sig-head', signalsG),
            tail = el('line', 'sig-tail', signalsG);
        head.setAttribute('r', '2.6');
        syn.path.classList.add('live');
        const to = syn.a === from ? syn.b : syn.a;
        signals.push({
            syn,
            from,
            t0: t,
            dur: 260 + Math.hypot(to.x - from.x, to.y - from.y) * 1.5,
            strength,
            visited,
            head,
            tail
        });
    };
    const spread = (from: Card, t: number, strength: number, visited: Set<Card>, except?: Synapse) => {
        visited.add(from);
        from.act = Math.max(from.act, strength);
        const next = strength * 0.62;
        if (next < 0.3) return;
        for (const sy of syns)
            if (sy !== except && (sy.a === from || sy.b === from) && !visited.has(sy.a === from ? sy.b : sy.a))
                fire(from, sy, t + 60, next, visited);
    };
    const signalStep = (t: number) => {
        if (!opened && !signals.length && t > Math.max(nextThought, bootEnd + 400)) {
            spread(cards[Math.floor(Math.random() * cards.length)], t, 1, new Set());
            nextThought = t + 3000 + Math.random() * 1800;
        }
        const arrived: Signal[] = [];
        signals = signals.filter((sg) => {
            const u = Math.max(0, (t - sg.t0) / sg.dur);
            if (u >= 1) {
                arrived.push(sg);
                return false;
            }
            const forward = sg.syn.a === sg.from;
            const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
            const at = (k: number) => {
                const v = Math.min(1, Math.max(0, k));
                return quad(sg.syn.geo.p, sg.syn.geo.c, sg.syn.geo.q, forward ? v : 1 - v);
            };
            const h = at(e),
                tl = at(e - 0.16);
            sg.head.setAttribute('cx', f1(h.x));
            sg.head.setAttribute('cy', f1(h.y));
            sg.head.style.opacity = String(0.4 + sg.strength * 0.6);
            sg.tail.setAttribute('x1', f1(tl.x));
            sg.tail.setAttribute('y1', f1(tl.y));
            sg.tail.setAttribute('x2', f1(h.x));
            sg.tail.setAttribute('y2', f1(h.y));
            sg.tail.style.opacity = String(sg.strength * 0.8);
            // Hidden units the signal passes light up
            for (const n of neurons) {
                const d = Math.hypot(n.x - h.x, n.y - h.y);
                if (d < 46) n.act = Math.max(n.act, (1 - d / 46) * sg.strength);
            }
            return true;
        });
        for (const sg of arrived) {
            sg.head.remove();
            sg.tail.remove();
            if (!signals.some((o) => o.syn === sg.syn)) sg.syn.path.classList.remove('live');
            const to = sg.syn.a === sg.from ? sg.syn.b : sg.syn.a;
            const len = Math.hypot(to.x - sg.from.x, to.y - sg.from.y) || 1;
            to.vx += ((to.x - sg.from.x) / len) * 30 * sg.strength;
            to.vy += ((to.y - sg.from.y) / len) * 30 * sg.strength;
            spread(to, t, sg.strength, sg.visited, sg.syn);
        }
    };

    let last = performance.now();
    const frame = (t: number) => {
        if (!web.isConnected) return;
        const dt = Math.min(50, t - last);
        last = t;
        if (visible) {
            const frozen = reduceMotion(),
                s = t / 1000;
            if (!frozen) physics(dt, s);
            for (const c of cards) {
                c.x = c.star.x + c.ox;
                c.y = c.star.y + c.oy;
                c.el.style.setProperty('--x', `${c.x}px`);
                c.el.style.setProperty('--y', `${c.y}px`);
            }
            const decay = Math.exp(-dt / 650);
            for (const n of neurons) {
                if (!frozen) {
                    const w = breeze(n.x0, n.y0, s);
                    n.x = n.x0 + w.x / K;
                    n.y = n.y0 + w.y / K;
                }
                n.act *= decay;
                if (pointer) {
                    const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
                    if (d < 150) n.act = Math.max(n.act, (1 - d / 150) * 0.85);
                }
                n.dot.setAttribute('cx', f1(n.x));
                n.dot.setAttribute('cy', f1(n.y));
                n.dot.setAttribute('r', f1(1.3 + n.act * 1.6));
                n.dot.style.setProperty('--a', n.act.toFixed(2));
            }
            for (const w of wires) {
                const m = w.m;
                const end = 'star' in m ? port(m, w.n) : m;
                w.line.setAttribute('x1', f1(w.n.x));
                w.line.setAttribute('y1', f1(w.n.y));
                w.line.setAttribute('x2', f1(end.x));
                w.line.setAttribute('y2', f1(end.y));
                w.line.style.setProperty('--a', Math.max(w.n.act, 'star' in m ? 0 : m.act).toFixed(2));
            }
            for (const sy of syns) {
                const p = port(sy.a, sy.b),
                    q = port(sy.b, sy.a);
                const dx = q.x - p.x,
                    dy = q.y - p.y,
                    len = Math.hypot(dx, dy) || 1;
                const c = {
                    x: (p.x + q.x) / 2 - (dy / len) * len * sy.bend,
                    y: (p.y + q.y) / 2 + (dx / len) * len * sy.bend
                };
                sy.geo = { p, q, c };
                sy.path.setAttribute('d', `M${f1(p.x)} ${f1(p.y)}Q${f1(c.x)} ${f1(c.y)} ${f1(q.x)} ${f1(q.y)}`);
                sy.pa.setAttribute('cx', f1(p.x));
                sy.pa.setAttribute('cy', f1(p.y));
                sy.pb.setAttribute('cx', f1(q.x));
                sy.pb.setAttribute('cy', f1(q.y));
            }
            if (!frozen) signalStep(t);
            drawAttention();
            for (const c of cards) {
                c.act *= decay;
                if (Math.abs(c.act - c.shown) > 0.01) {
                    c.shown = c.act;
                    c.el.style.setProperty('--act', c.act.toFixed(2));
                }
            }
        }
        requestAnimationFrame(frame);
    };

    // Unfold in place; an unfolded project activates its neighbours
    let opened: Card | null = null;
    const mark = (c: Card, on: boolean) => {
        for (const sy of syns) {
            if (sy.a !== c && sy.b !== c) continue;
            for (const n of [sy.path, sy.pa, sy.pb]) n.classList.toggle('hot', on);
            const other = (sy.a === c ? sy.b : sy.a).el;
            other.classList.toggle('near', on);
            if (on) other.dataset.score = `${sy.s.toFixed(2)} similar`;
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
        if (!reduceMotion()) spread(c, performance.now() + 150, 0.75, new Set());
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

    // Query from outside (round 11): light up every project of a domain and let the activation spread
    host.addEventListener('nm-query', (e) => {
        const domain = (e as CustomEvent<string>).detail,
            t = performance.now();
        nextThought = t + 4000;
        cards
            .filter((c) => c.star.p.category === domain)
            .forEach((c, i) => (reduceMotion() ? (c.act = 1) : spread(c, t + i * 140, 0.95, new Set())));
    });

    build();
    window.addEventListener('resize', build);
    requestAnimationFrame(frame);

    return (domain: string) => {
        web.classList.toggle('dim-domain', domain !== 'all');
        els.forEach((c) => c.classList.toggle('in-domain', c.dataset.domain === domain));
    };
}

export const variantM = (root: HTMLElement) => variantF(root, (host) => mountBrain(host), 'Network', true);
