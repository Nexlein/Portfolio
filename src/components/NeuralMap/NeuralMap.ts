/**
 * The project map: projects as a small neural network.
 * - Synapses join each project to its 2 most similar ones; width and brightness are the similarity.
 * - Hidden neurons: a faint latent layer between the projects.
 * - Spreading activation: now and then a "thought" starts at a project and spreads to its neighbours, weaker at
 *   each step. Hovering a project, or asking for a domain, starts one too.
 * - The cursor is an input: nearby hidden neurons light up, attention lines reach the 3 nearest projects.
 * - Living motion: a slow breeze moves neighbours together, synapses act as soft springs, events push.
 * - More than MAP_MAX projects: the map shows the first ones (pickShown), the list always has them all.
 * The static project list stays the source of truth (no JavaScript, phones); this map is drawn on top of it.
 */
import { i18n } from '@/core/i18n';
import { localizedPath } from '@/core/lang';
import { f1, firstSentence } from '@/core/text';
import { NOW } from '@/data/profile';
import { PERIODS, PROJECTS, projectPath, type ProjectEntry } from '@/data/projects';
import { domainIcon } from '@/ui/icons';
import { prefersReducedMotion as reduced } from '@/ui/motion';
import { stillAttrs } from '@/ui/video';
import { CARD, fitFor, layout, MAP_MAX, neighbours, NOW_BOX, ORBIT, pickShown, type Star } from './graph';
import {
    breeze,
    port,
    quad,
    scatterNeurons,
    SPRING,
    stepBodies,
    widestGap,
    wireNeurons,
    type Body,
    type Pt
} from './scene';

const SVG = 'http://www.w3.org/2000/svg';
const OPEN_W = 330;
const ATTN_REACH = 340;

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

interface Card extends Body {
    star: Star;
    el: HTMLAnchorElement;
    delay: number;
    act: number; // activation 0..1, shown as a glow
    shown: number; // last activation written to the DOM
    timer: number; // pending hover-intent timeout (open or close) of this card
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

function cardHtml(p: ProjectEntry): string {
    const lang = i18n.getLang();
    return `<a class="nm-card" href="${localizedPath(projectPath(p.id), lang)}" data-id="${p.id}" data-domain="${p.category}">
<span class="nm-head"><span class="nm-ico">${domainIcon(p.category)}</span>
<span class="nm-txt"><strong>${p.title}</strong><span class="mono">${p.tags.slice(0, 2).join(' · ')}</span></span></span>
<span class="nm-more"><span class="nm-inner">
  <span class="nm-media"><img ${stillAttrs(p, '164px')} alt="" loading="lazy" /></span>
  <span class="nm-desc">${firstSentence(p.description[lang])}</span>
  <span class="mono nm-skills">${i18n.t(`home.work.periods.${p.year}`)} · ${p.tags.slice(0, 4).join(' · ')}</span>
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
    /** Light up a domain and keep it lit (the other projects dim): its projects fire. `null` clears the filter. */
    query: (domain: string | null) => void;
}

export function mountNeuralMap(host: HTMLElement): NeuralMap {
    const shown = pickShown(PROJECTS, MAP_MAX);
    host.innerHTML = `<div class="nm" role="group" aria-label="${i18n.t('home.work.mapLabel')}">
<svg aria-hidden="true"><g class="nm-layers"></g><g class="nm-wires"></g><g class="nm-neurons"></g><g class="nm-syns"></g><g class="nm-signals"></g><g class="nm-attn"></g><g class="nm-labels"></g></svg>
${nowHtml()}
${shown.map(cardHtml).join('')}</div>`;

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

    let cards: Card[] = [],
        syns: Synapse[] = [],
        neurons: Neuron[] = [],
        wires: Wire[] = [],
        signals: Signal[] = [];
    const attn = Array.from({ length: 3 }, () => svg('line', 'nm-attn-line', attnG));

    /** Synapses: each shown project to its 2 most similar shown ones. */
    const wire = () => {
        const byId = new Map(cards.map((c) => [c.star.p.id, c]));
        const seen = new Set<string>();
        for (const c of cards)
            for (const { q, s } of neighbours(c.star.p, shown).slice(0, 2)) {
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
        reset();
        const cx = W / 2,
            cy = H / 2,
            fit = fitFor(W, H);
        for (const g of [layersG, wiresG, neuronsG, synsG, signalsG, labelsG]) g.innerHTML = '';
        syns = [];
        signals = [];
        attended = []; // they point at the cards about to be replaced
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
            shown: -1,
            timer: 0
        }));

        // Period layers: a dotted ellipse each, labelled in its widest gap that no card (of any layer) covers
        PERIODS.toReversed().forEach((period, ring) => {
            const r = ORBIT[period];
            const own = cards.filter((c) => c.star.p.year === period);
            const ang = own.map((c) => Math.atan2((c.y - cy) / fit.ry, (c.x - cx) / fit.rx));
            const text = svg('text', 'nm-layer-label', labelsG);
            text.textContent = i18n.t(`home.work.periods.${period}`);
            const tw = text.getBBox().width + 16,
                th = 20;
            const clear = (x: number, y: number) =>
                cards.every((c) => Math.abs(c.x - x) >= (CARD.w + tw) / 2 || Math.abs(c.y - y) >= (CARD.h + th) / 2) &&
                (Math.abs(x - cx) >= (NOW_BOX.w + tw) / 2 || Math.abs(y - cy) >= (NOW_BOX.h + th) / 2);
            const mid = widestGap(ang, (a) => clear(cx + Math.cos(a) * fit.rx * r, cy + Math.sin(a) * fit.ry * r));
            const e = svg('ellipse', 'nm-layer', layersG);
            e.setAttribute('cx', f1(cx));
            e.setAttribute('cy', f1(cy));
            e.setAttribute('rx', f1(fit.rx * r));
            e.setAttribute('ry', f1(fit.ry * r));
            e.style.setProperty('--d', `${100 + ring * 300}ms`);
            text.setAttribute('x', f1(cx + Math.cos(mid) * fit.rx * r));
            text.setAttribute('y', f1(cy + Math.sin(mid) * fit.ry * r + 3.5));
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

        const spots = scatterNeurons({ x: cx, y: cy }, fit, cards);
        neurons = spots.map(({ x, y, delay }) => {
            const dot = svg('circle', 'nm-neuron', neuronsG);
            dot.style.setProperty('--d', `${delay}ms`);
            return { x0: x, y0: y, x, y, act: 0, dot };
        });
        wires = wireNeurons(spots, cards).map(({ from, to }) => ({
            n: neurons[from],
            m: typeof to === 'number' ? neurons[to] : to,
            line: svg('line', 'nm-wire', wiresG)
        }));

        now.style.left = `${cx}px`;
        now.style.top = `${cy}px`;
        applyFilter();
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
            // Most of the map, or as much of it as a short window can hold
            if (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= innerHeight * 0.75) boot(performance.now());
            wake();
        },
        { threshold: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35] }
    ).observe(web);
    document.addEventListener('visibilitychange', () => wake());

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
        const at = pointer;
        attended =
            at && !opened
                ? cards
                      .map((c) => ({ c, d: Math.hypot(c.x - at.x, c.y - at.y) }))
                      .toSorted((a, b) => a.d - b.d)
                      .slice(0, 3)
                      .filter(({ d }) => d < ATTN_REACH)
                      .map(({ c, d }) => ({ c, w: 1 - d / ATTN_REACH }))
                : [];
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

    let last = performance.now();
    let running = false; // a frame is queued
    const frame = (t: number) => {
        // Scrolled away or tab hidden: stop asking for frames until `wake`
        if (!web.isConnected || !visible || document.hidden) return void (running = false);
        if (t - last < FRAME_MS) return void requestAnimationFrame(frame); // 30 fps is plenty for a slow drift
        const dt = Math.min(50, t - last);
        last = t;
        if (cards.length) {
            const calm = reduced(),
                s = t / 1000;
            if (!calm) stepBodies(cards, syns, attended, pointer, dt, s);
            for (const c of cards) {
                c.x = c.star.x + c.ox;
                c.y = c.star.y + c.oy;
                put(c.el, 'translate', `${f1(c.x)}px ${f1(c.y)}px`);
            }
            const decay = Math.exp(-dt / 650);
            for (const n of neurons) {
                if (!calm) {
                    const w = breeze(n.x0, n.y0, s);
                    n.x = n.x0 + w.x / SPRING;
                    n.y = n.y0 + w.y / SPRING;
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
    // The domain filter: its projects stay lit, the others dim until it is cleared
    let filter: string | null = null;
    const applyFilter = () => {
        web.classList.toggle('filtered', filter !== null);
        for (const el of els) el.classList.toggle('dim', filter !== null && el.dataset.domain !== filter);
    };

    /** Forget every transient state (open card, badges, hover timers) before the map is redrawn. */
    const reset = () => {
        for (const c of cards) clearTimeout(c.timer);
        if (opened) close(opened);
        for (const el of els) {
            el.classList.remove('open', 'near');
            delete el.dataset.score;
        }
        web.classList.remove('focus');
        opened = null;
    };
    const mark = (c: Card, on: boolean) => {
        for (const sy of syns) {
            if (sy.a !== c && sy.b !== c) continue;
            for (const n of [sy.path, sy.pa, sy.pb]) n.classList.toggle('hot', on);
            const other = (sy.a === c ? sy.b : sy.a).el;
            other.classList.toggle('near', on);
            if (on) other.dataset.score = i18n.t('home.work.similar', { s: Math.round(sy.s * 100) });
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
        // Unfolding upward keeps the closed card's bottom edge in place: with any gap, a pointer resting there
        // would leave the open card, close it, land on it again and loop
        c.el.style.setProperty('--h0', `${c.el.offsetHeight}px`);
        const overflow = Math.max(0, c.star.x + OPEN_W / 2 + 16 - W) - Math.max(0, OPEN_W / 2 + 16 - c.star.x);
        c.el.style.setProperty('--dx', `${-overflow}px`);
        c.el.classList.add('open');
        web.classList.add('focus');
        mark(c, true);
        if (!reduced()) spread(c, performance.now() + 150, 0.75, new Set());
    };

    // Hover intent is per card: moving from one card to the next must not cancel the first one's close
    const later = (c: Card, fn: () => void, ms: number) => {
        clearTimeout(c.timer);
        c.timer = window.setTimeout(fn, ms);
    };
    const cardOf = (a: HTMLAnchorElement) => cards.find((c) => c.el === a);
    els.forEach((a) => {
        a.addEventListener('pointerenter', (e) => {
            const c = cardOf(a);
            if (e.pointerType === 'touch' || !c) return;
            c.hold = true;
            later(c, () => open(c), 120);
        });
        a.addEventListener('pointerleave', (e) => {
            const c = cardOf(a);
            if (e.pointerType === 'touch' || !c) return;
            later(c, () => close(c), 160);
        });
        a.addEventListener('focus', () => {
            const c = cardOf(a);
            // Keyboard focus only: a tap focuses the link too, and opening there would make the first tap follow it
            if (c && a.matches(':focus-visible')) open(c);
        });
        a.addEventListener('blur', () => {
            const c = cardOf(a);
            if (c) close(c);
        });
        a.addEventListener('click', (e) => {
            const c = cardOf(a);
            // A first tap unfolds, the second follows the link. A mouse has hover for that: its click is always a click
            if (c && !a.classList.contains('open') && e.pointerType !== 'mouse') {
                e.preventDefault();
                open(c);
            }
        });
    });
    window.addEventListener('keydown', (e) => e.key === 'Escape' && opened && close(opened));
    document.addEventListener('pointerdown', (e) => opened && !opened.el.contains(e.target as Node) && close(opened));

    build();
    let resizeTimer = 0;
    let size = `${web.clientWidth}x${web.clientHeight}`;
    // The map's own box, not the window: it also changes when the map comes back from the list view (hidden there,
    // so a window resize meanwhile measured nothing and the cards would keep the old width's places)
    new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            const next = `${web.clientWidth}x${web.clientHeight}`;
            if (next === size) return; // e.g. a phone's address bar sliding away: nothing to redraw
            size = next;
            build();
        }, 150);
    }).observe(web);
    function wake() {
        if (running) return;
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
    }
    wake();

    return {
        query: (domain) => {
            filter = domain;
            applyFilter();
            if (!domain) return;
            const t = performance.now();
            nextThought = t + 4000;
            cards
                .filter((c) => c.star.p.category === domain)
                .forEach((c, i) => (reduced() ? (c.act = 1) : spread(c, t + i * 140, 0.95, new Set())));
        }
    };
}
