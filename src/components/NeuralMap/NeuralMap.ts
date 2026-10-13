/**
 * The project map: projects as a small neural network.
 * - Synapses join each project to its 2 most similar ones; width and brightness are the similarity.
 * - Hidden neurons: a faint latent layer between the projects.
 * - Spreading activation: now and then a "thought" starts at a project and spreads to its neighbours, weaker at
 *   each step. Hovering a project, or asking for a domain, starts one too.
 * - The cursor is an input: nearby hidden neurons light up, attention lines reach the 3 nearest projects.
 * - Living motion: a slow breeze moves neighbours together, synapses act as soft springs, events push.
 * - More than `max` projects: the extra ones rotate in, one every ~8 s, most similar first.
 * The static project list stays the source of truth (no JavaScript, phones); this map is drawn on top of it.
 */
import { i18n } from '@/core/i18n';
import { localizedPath } from '@/core/translate';
import { NOW } from '@/data/profile';
import { PROJECTS, projectPath, type ProjectEntry } from '@/data/projects';
import { domainIcon } from '@/ui/icons';
import { videoPoster } from '@/ui/video';
import { fitFor, layout, neighbours, ORBIT, periodOf, pickShown, similarity, type Period, type Star } from './graph';

const SVG = 'http://www.w3.org/2000/svg';
const OPEN_W = 330;
const HALF = { w: 95, h: 26 }; // card half size, for ports
const ATTN_REACH = 340;
const NEURONS = 72;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const f1 = (n: number) => n.toFixed(1);

/** The drifting map redraws about 30 times a second: every redraw restyles dozens of cards and hundreds of lines. */
const FRAME_MS = 30;

const written = new WeakMap<Element, Record<string, string>>();
/** Write an attribute, a --custom property or `translate` only when its value changed: most frames move nothing visible. */
function put(el: Element, name: string, value: string): void {
    let seen = written.get(el);
    if (!seen) written.set(el, (seen = {}));
    if (seen[name] === value) return;
    seen[name] = value;
    if (name === 'translate') (el as HTMLElement).style.translate = value;
    else if (name.startsWith('--')) (el as HTMLElement | SVGElement).style.setProperty(name, value);
    else el.setAttribute(name, value);
}

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
    geo: { p: Pt; q: Pt; c: Pt };
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

function svg<K extends keyof SVGElementTagNameMap>(tag: K, cls: string, parent: Element): SVGElementTagNameMap[K] {
    const node = document.createElementNS(SVG, tag);
    node.setAttribute('class', cls);
    parent.appendChild(node);
    return node;
}

/** Where the line from a card's centre toward `to` leaves the card. */
function port(c: Pt, to: Pt): Pt {
    const dx = to.x - c.x,
        dy = to.y - c.y;
    const t = Math.min(HALF.w / (Math.abs(dx) || 1e-6), HALF.h / (Math.abs(dy) || 1e-6), 1);
    return { x: c.x + dx * t, y: c.y + dy * t };
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

function seeded(seed: number): () => number {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

const still = (p: ProjectEntry) =>
    p.media.type === 'video'
        ? videoPoster(p.media.src)
        : p.media.type === 'image'
          ? p.media.src
          : p.media.images[0].src;

function cardHtml(p: ProjectEntry): string {
    const lang = i18n.getLang();
    const line = p.description[lang].split('. ')[0].replace(/\.$/, '');
    return `<a class="nm-card" href="${localizedPath(projectPath(p.id), lang)}" data-id="${p.id}" data-domain="${p.category}">
<span class="nm-head"><span class="nm-ico">${domainIcon(p.category)}</span>
<span class="nm-txt"><strong>${p.title}</strong><span class="mono">${p.tags.slice(0, 2).join(' · ')}</span></span></span>
<span class="nm-more"><span class="nm-inner">
  <span class="nm-media"><img src="${still(p)}" alt="" loading="lazy" /></span>
  <span class="nm-desc">${line}.</span>
  <span class="mono nm-skills">${i18n.t(`home.work.periods.${periodOf(p)}`)} · ${p.tags.slice(0, 4).join(' · ')}</span>
  <span class="nm-go">${i18n.t('home.work.open')} <span aria-hidden="true">→</span></span>
</span></span></a>`;
}

function nowHtml(): string {
    const lang = i18n.getLang();
    return `<div class="nm-now">
<span class="mono nm-now-eyebrow"><span class="nm-live" aria-hidden="true"></span>${i18n.t('home.work.now')}</span>
<strong>${NOW.role[lang]}</strong><span class="nm-now-focus">${NOW.focus[lang]}</span><span class="mono">${NOW.detail[lang]}</span>
</div>`;
}

export interface NeuralMap {
    /** Light up a domain: its hidden projects are called in, then its projects fire. */
    query: (domain: string) => void;
    /** Projects shown / total. */
    shown: number;
}

export function mountNeuralMap(host: HTMLElement, max = 24): NeuralMap {
    const { shown, hidden } = pickShown(PROJECTS, max);
    host.innerHTML = `<div class="nm" role="group" aria-label="${i18n.t('home.work.mapLabel')}">
<svg aria-hidden="true"><g class="nm-layers"></g><g class="nm-wires"></g><g class="nm-neurons"></g><g class="nm-syns"></g><g class="nm-signals"></g><g class="nm-attn"></g><g class="nm-labels"></g></svg>
${nowHtml()}
${PROJECTS.map(cardHtml).join('')}</div>`;

    const web = host.querySelector<HTMLElement>('.nm')!;
    const group = (c: string) => web.querySelector(`.nm-${c}`)!;
    const layersG = group('layers'),
        wiresG = group('wires'),
        neuronsG = group('neurons'),
        synsG = group('syns'),
        signalsG = group('signals'),
        attnG = group('attn'),
        labelsG = group('labels');
    const now = web.querySelector<HTMLElement>('.nm-now')!;
    const els = [...web.querySelectorAll<HTMLAnchorElement>('.nm-card')];
    const elOf = (p: ProjectEntry) => els.find((c) => c.dataset.id === p.id)!;
    for (const p of hidden) elOf(p).classList.add('off');

    let cards: Card[] = [],
        syns: Synapse[] = [],
        neurons: Neuron[] = [],
        wires: Wire[] = [],
        signals: Signal[] = [];
    const attn = Array.from({ length: 3 }, () => svg('line', 'nm-attn-line', attnG));

    /** Synapses: each shown project to its 2 most similar shown ones. Rebuilt when a project rotates in. */
    const wire = (fresh?: Card) => {
        const byId = new Map(cards.map((c) => [c.star.p.id, c]));
        const seen = new Set<string>();
        for (const sy of syns) for (const n of [sy.path, sy.pa, sy.pb]) n.remove();
        syns = [];
        const pool = cards.map((c) => c.star.p);
        for (const c of cards)
            for (const { q, s } of neighbours(c.star.p, pool).slice(0, 2)) {
                const key = c.star.p.id < q.id ? `${c.star.p.id}|${q.id}` : `${q.id}|${c.star.p.id}`;
                if (seen.has(key)) continue;
                seen.add(key);
                const b = byId.get(q.id)!;
                const path = svg('path', 'nm-syn', synsG);
                path.setAttribute('pathLength', '1');
                path.style.setProperty('--w', String(s));
                const delay = `${Math.max(c.delay, b.delay) + 250}ms`;
                path.style.setProperty('--d', delay);
                const pa = svg('circle', 'nm-port', synsG),
                    pb = svg('circle', 'nm-port', synsG);
                for (const pt of [pa, pb]) {
                    pt.setAttribute('r', '2.2');
                    pt.style.setProperty('--d', delay);
                }
                if (fresh && (c === fresh || b === fresh)) path.classList.add('grow');
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
    };

    const build = () => {
        const W = web.clientWidth,
            H = web.clientHeight;
        if (W < 400) return; // hidden: phones get the list
        const cx = W / 2,
            cy = H / 2,
            fit = fitFor(W, H);
        for (const g of [layersG, wiresG, neuronsG, synsG, signalsG, labelsG]) g.innerHTML = '';
        syns = [];
        signals = [];
        cards = layout(W, H, fit, shown).map((star) => ({
            star,
            el: elOf(star.p),
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

        // Period layers: a dotted ellipse each, labelled in its widest gap
        (Object.keys(ORBIT) as Period[]).forEach((period, ring) => {
            const r = ORBIT[period];
            const own = cards.filter((c) => periodOf(c.star.p) === period);
            const ang = own.map((c) => Math.atan2((c.y - cy) / fit.ry, (c.x - cx) / fit.rx));
            let best = { gap: -1, mid: -Math.PI / 2 };
            for (let k = 0; k < 48; k++) {
                const a = -Math.PI + (k / 48) * Math.PI * 2;
                const gap = Math.min(
                    ...ang.map((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))),
                    Math.PI
                );
                if (gap > best.gap) best = { gap, mid: a };
            }
            const e = svg('ellipse', 'nm-layer', layersG);
            e.setAttribute('cx', f1(cx));
            e.setAttribute('cy', f1(cy));
            e.setAttribute('rx', f1(fit.rx * r));
            e.setAttribute('ry', f1(fit.ry * r));
            e.style.setProperty('--d', `${100 + ring * 300}ms`);
            const text = svg('text', 'nm-layer-label', labelsG);
            text.textContent = i18n.t(`home.work.periods.${period}`);
            text.setAttribute('x', f1(cx + Math.cos(best.mid) * fit.rx * r));
            text.setAttribute('y', f1(cy + Math.sin(best.mid) * fit.ry * r + 3.5));
            const box = text.getBBox(),
                plate = svg('rect', 'nm-layer-plate', labelsG);
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
        wire();

        // Hidden neurons: seeded, inside the outer layer, clear of cards and of "Now"
        const rnd = seeded(4242);
        const fx = fit.rx + 70,
            fy = fit.ry + 20;
        neurons = [];
        for (let tries = 0; neurons.length < NEURONS && tries < 4000; tries++) {
            const x = cx + (rnd() * 2 - 1) * fx,
                y = cy + (rnd() * 2 - 1) * fy;
            if (Math.hypot((x - cx) / fx, (y - cy) / fy) > 1) continue;
            if (Math.abs(x - cx) < 170 && Math.abs(y - cy) < 62) continue;
            if (cards.some((c) => Math.abs(x - c.x) < HALF.w + 14 && Math.abs(y - c.y) < HALF.h + 14)) continue;
            if (neurons.some((n) => Math.hypot(n.x0 - x, n.y0 - y) < 34)) continue;
            const dot = svg('circle', 'nm-neuron', neuronsG);
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
                wires.push({ n, m: neurons[best.j], line: svg('line', 'nm-wire', wiresG) });
            }
            const card = cards.find((c) => Math.hypot(c.x - n.x0, c.y - n.y0) < 150);
            if (card) wires.push({ n, m: card, line: svg('line', 'nm-wire', wiresG) });
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
        if (reduced()) {
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
        const at = pointer;
        if (at && !opened) {
            const pool = cards.map((c) => ({ c, d: Math.hypot(c.x - at.x, c.y - at.y) }));
            for (let k = 0; k < 3 && pool.length; k++) {
                const best = pool.reduce((a, b) => (b.d < a.d ? b : a));
                pool.splice(pool.indexOf(best), 1);
                if (best.d < ATTN_REACH) attended.push({ c: best.c, w: 1 - best.d / ATTN_REACH });
            }
        }
        attn.forEach((line, k) => {
            const a = attended[k];
            if (!a || !at) {
                line.style.opacity = '0';
                return;
            }
            const p = port(a.c, at);
            line.setAttribute('x1', f1(at.x));
            line.setAttribute('y1', f1(at.y));
            line.setAttribute('x2', f1(p.x));
            line.setAttribute('y2', f1(p.y));
            line.style.opacity = String(a.w * 0.85);
        });
    };

    // Living motion: rest springs, breeze, synapses as soft springs, pushes from events
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
        if (pointer)
            for (const { c, w } of attended) {
                const dx = pointer.x - c.x,
                    dy = pointer.y - c.y,
                    d = Math.hypot(dx, dy) || 1;
                f.get(c)!.x += (dx / d) * 18 * w;
                f.get(c)!.y += (dy / d) * 18 * w;
            }
        for (const c of cards) {
            if (c.hold) {
                c.vx = c.vy = 0; // the hovered card stays exactly where it is
                continue;
            }
            c.vx += f.get(c)!.x * h;
            c.vy += f.get(c)!.y * h;
            c.ox += c.vx * h;
            c.oy += c.vy * h;
        }
    };

    // Spreading activation
    let nextThought = 0;
    const fire = (from: Card, syn: Synapse, t: number, strength: number, visited: Set<Card>) => {
        const head = svg('circle', 'nm-sig-head', signalsG),
            tail = svg('line', 'nm-sig-tail', signalsG);
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
        if (!opened && !signals.length && cards.length && t > Math.max(nextThought, bootEnd + 400)) {
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

    // Rotation: past `max` projects, one shown project leaves every ~8 s and a related hidden one takes its place.
    // Paused while the pointer is on the map, while a card is open, off-screen and with reduced motion.
    const swap = (out: Card, inP: ProjectEntry) => {
        const outP = out.star.p,
            inEl = elOf(inP);
        out.el.classList.add('leaving');
        setTimeout(() => {
            out.el.classList.add('off');
            out.el.classList.remove('leaving');
            hidden.splice(hidden.indexOf(inP), 1);
            hidden.push(outP);
            shown.splice(shown.indexOf(outP), 1, inP);
            out.star.p = inP;
            out.el = inEl;
            put(inEl, 'translate', `${f1(out.x)}px ${f1(out.y)}px`);
            inEl.classList.add('entering');
            inEl.classList.remove('off');
            void inEl.offsetWidth;
            inEl.classList.remove('entering');
            for (const sg of signals) for (const n of [sg.head, sg.tail]) n.remove();
            signals = [];
            wire(out);
            out.act = 0.8; // the newcomer arrives lit
        }, 450);
    };
    let nextSwap = 0;
    const rotate = (t: number) => {
        if (!hidden.length || opened || pointer || reduced() || t < Math.max(nextSwap, bootEnd + 4000)) return;
        nextSwap = t + 8000;
        const pool = cards.filter((c) => !c.star.p.featured && c.act < 0.3);
        if (!pool.length) return;
        const out = pool[Math.floor(Math.random() * pool.length)];
        const score = (q: ProjectEntry) => similarity(out.star.p, q) + (periodOf(q) === periodOf(out.star.p) ? 0.5 : 0);
        swap(
            out,
            hidden.reduce((a, q) => (score(q) > score(a) ? q : a))
        );
    };

    let last = performance.now();
    const frame = (t: number) => {
        if (!web.isConnected) return;
        if (t - last < FRAME_MS) return void requestAnimationFrame(frame); // 30 fps is plenty for a slow drift
        const dt = Math.min(50, t - last);
        last = t;
        if (visible && cards.length) {
            const calm = reduced(),
                s = t / 1000;
            if (!calm) physics(dt, s);
            for (const c of cards) {
                c.x = c.star.x + c.ox;
                c.y = c.star.y + c.oy;
                put(c.el, 'translate', `${f1(c.x)}px ${f1(c.y)}px`);
            }
            const decay = Math.exp(-dt / 650);
            for (const n of neurons) {
                if (!calm) {
                    const w = breeze(n.x0, n.y0, s);
                    n.x = n.x0 + w.x / K;
                    n.y = n.y0 + w.y / K;
                }
                n.act *= decay;
                if (pointer) {
                    const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
                    if (d < 150) n.act = Math.max(n.act, (1 - d / 150) * 0.85);
                }
                put(n.dot, 'cx', f1(n.x));
                put(n.dot, 'cy', f1(n.y));
                put(n.dot, 'r', f1(1.3 + n.act * 1.6));
                put(n.dot, '--a', n.act.toFixed(2));
            }
            for (const w of wires) {
                const m = w.m;
                const end = 'star' in m ? port(m, w.n) : m;
                put(w.line, 'x1', f1(w.n.x));
                put(w.line, 'y1', f1(w.n.y));
                put(w.line, 'x2', f1(end.x));
                put(w.line, 'y2', f1(end.y));
                put(w.line, '--a', Math.max(w.n.act, 'star' in m ? 0 : m.act).toFixed(2));
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
                put(sy.path, 'd', `M${f1(p.x)} ${f1(p.y)}Q${f1(c.x)} ${f1(c.y)} ${f1(q.x)} ${f1(q.y)}`);
                put(sy.pa, 'cx', f1(p.x));
                put(sy.pa, 'cy', f1(p.y));
                put(sy.pb, 'cx', f1(q.x));
                put(sy.pb, 'cy', f1(q.y));
            }
            if (!calm) signalStep(t);
            rotate(t);
            drawAttention();
            for (const c of cards) {
                c.act *= decay;
                if (Math.abs(c.act - c.shown) > 0.01) {
                    c.shown = c.act;
                    put(c.el, '--act', c.act.toFixed(2));
                }
            }
        }
        requestAnimationFrame(frame);
    };

    // A card unfolds in place (hover with intent, focus, first tap); its neighbours light up with their similarity
    let opened: Card | null = null;
    const mark = (c: Card, on: boolean) => {
        for (const sy of syns) {
            if (sy.a !== c && sy.b !== c) continue;
            for (const n of [sy.path, sy.pa, sy.pb]) n.classList.toggle('hot', on);
            const other = (sy.a === c ? sy.b : sy.a).el;
            other.classList.toggle('near', on);
            if (on) other.dataset.score = i18n.t('home.work.similar').replace('{s}', sy.s.toFixed(2));
            else delete other.dataset.score;
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
        if (!reduced()) spread(c, performance.now() + 150, 0.75, new Set());
    };

    let timer = 0;
    const later = (fn: () => void, ms: number) => {
        clearTimeout(timer);
        timer = window.setTimeout(fn, ms);
    };
    const cardOf = (a: HTMLAnchorElement) => cards.find((c) => c.el === a);
    els.forEach((a) => {
        a.addEventListener('pointerenter', (e) => {
            const c = cardOf(a);
            if (e.pointerType === 'touch' || !c) return;
            c.hold = true;
            later(() => open(c), 120);
        });
        a.addEventListener('pointerleave', (e) => {
            const c = cardOf(a);
            if (e.pointerType === 'touch' || !c) return;
            later(() => close(c), 160);
        });
        a.addEventListener('focus', () => {
            const c = cardOf(a);
            if (c) open(c);
        });
        a.addEventListener('blur', () => {
            const c = cardOf(a);
            if (c) close(c);
        });
        a.addEventListener('click', (e) => {
            const c = cardOf(a);
            if (c && !a.classList.contains('open')) {
                e.preventDefault(); // first tap unfolds, the second follows the link
                open(c);
            }
        });
    });
    window.addEventListener('keydown', (e) => e.key === 'Escape' && opened && close(opened));
    document.addEventListener('pointerdown', (e) => opened && !opened.el.contains(e.target as Node) && close(opened));

    build();
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(build, 150);
    });
    requestAnimationFrame(frame);

    return {
        shown: shown.length,
        query: (domain) => {
            // Hidden projects of that domain come in first, replacing the most related shown ones
            const calls = hidden.filter((p) => p.category === domain).slice(0, 2);
            calls.forEach((p, i) => {
                const out = cards
                    .filter((c) => c.star.p.category !== domain && !c.star.p.featured && c !== opened)
                    .reduce<Card | null>(
                        (a, c) => (!a || similarity(c.star.p, p) > similarity(a.star.p, p) ? c : a),
                        null
                    );
                if (out) setTimeout(() => swap(out, p), i * 300);
            });
            setTimeout(
                () => {
                    const t = performance.now();
                    nextThought = t + 4000;
                    cards
                        .filter((c) => c.star.p.category === domain)
                        .forEach((c, i) => (reduced() ? (c.act = 1) : spread(c, t + i * 140, 0.95, new Set())));
                },
                calls.length ? 700 : 0
            );
        }
    };
}
