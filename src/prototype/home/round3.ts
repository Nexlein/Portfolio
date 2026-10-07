// PROTOTYPE — Round 3 (F): compact hero, branch trees, projects as a neural network (layers = Tek1 → Tek2 → Personal,
// edges = shared technologies) with a list view where every project is small and opens big on click.
import './round2.css';
import './round3.css';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { EXPERIENCES } from '@/data/profile';
import { policyField } from './variant-a';
import { DOMAIN_LABEL, curve, media, metaLine, offer, oneLiner, still, tags } from './round2';

const LAYERS = ['Tek1', 'Tek2', 'Personal'] as const;
const yearOf = (p: ProjectEntry) => p.year ?? 'Tek2';
const noop = (): void => undefined;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Technologies a project uses, normalized so related tags link (C/C++ = C + C++; RL = Reinforcement Learning). */
function skills(p: ProjectEntry): Set<string> {
    const out = new Set<string>();
    for (const raw of p.tags) {
        for (const part of raw.toLowerCase().split('/')) {
            const tag = part.trim() === 'rl' ? 'reinforcement learning' : part.trim();
            out.add(tag);
            if (tag === 'c' || tag === 'c++') out.add('c-family'); // C skills carry over to C++
        }
    }
    return out;
}

interface Edge {
    a: ProjectEntry;
    b: ProjectEntry;
    shared: string[];
}

/** Edges between consecutive layers, one per pair of projects sharing at least one technology. */
function edges(): Edge[] {
    const out: Edge[] = [];
    for (let l = 0; l < LAYERS.length - 1; l++) {
        for (const a of PROJECTS.filter((p) => yearOf(p) === LAYERS[l])) {
            for (const b of PROJECTS.filter((p) => yearOf(p) === LAYERS[l + 1])) {
                const sb = skills(b);
                const shared = [...skills(a)].filter((t) => sb.has(t) && t !== 'c-family');
                if (shared.length || (skills(a).has('c-family') && sb.has('c-family')))
                    out.push({ a, b, shared: shared.length ? shared : ['C → C++'] });
            }
        }
    }
    return out;
}

export function detail(p: ProjectEntry, closable: boolean): string {
    return `${media(p, true)}<div>${closable ? '<button type="button" class="vf-close">Close</button>' : ''}${metaLine(p)}
<h3>${p.title}</h3><p>${p.description.en}</p>${tags(p, 6)}<a class="vr-open" href="/projects/${p.id}.html">Open the project page →</a></div>`;
}

/* ── Branch tree ─────────────────────────────────────────── */

interface TreeNode {
    id: string;
    label: string;
    hint: string;
}

function tree(id: string, question: string, nodes: TreeNode[]): string {
    return `<div class="vf-tree" id="${id}"><p class="vf-tree-q">${question}</p><div class="vf-tree-links"><svg aria-hidden="true"></svg></div>
<div class="vf-tree-nodes" data-n="${nodes.length}" role="group" aria-label="${question}">${nodes
        .map(
            (n) =>
                `<button type="button" data-id="${n.id}" aria-pressed="false"><strong>${n.label}</strong><span class="mono">${n.hint}</span></button>`
        )
        .join('')}</div></div>`;
}

function bindTree(el: HTMLElement, onChoose: (id: string) => void, initial?: string): void {
    const svg = el.querySelector('svg')!;
    const buttons = [...el.querySelectorAll<HTMLButtonElement>('button')];
    el.querySelector<HTMLElement>('.vf-tree-nodes')!.style.setProperty('--n', String(buttons.length));
    let active: string | null = initial ?? null;
    const draw = () => {
        const box = svg.getBoundingClientRect();
        svg.innerHTML = buttons
            .map((b) => {
                const r = b.getBoundingClientRect(),
                    tx = r.left + r.width / 2 - box.left,
                    sx = box.width / 2;
                return `<path class="${b.dataset.id === active ? 'on' : ''}" d="M ${sx} 0 C ${sx} ${box.height / 2}, ${tx} ${box.height / 2}, ${tx} ${box.height}" />`;
            })
            .join('');
    };
    const choose = (id: string, notify = true) => {
        active = id;
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
        el.classList.add('has-choice');
        draw();
        if (notify) onChoose(id);
    };
    buttons.forEach((b) => b.addEventListener('click', () => choose(b.dataset.id!)));
    window.addEventListener('resize', draw);
    requestAnimationFrame(() => (initial ? choose(initial, false) : draw()));
}

/* ── Neural network view ─────────────────────────────────── */

function mountNetwork(host: HTMLElement, detailHost: HTMLElement): (domain: string) => void {
    const allEdges = edges();
    host.innerHTML = `<div class="vf-net" aria-label="Projects as a network: columns are Tek1, Tek2 and personal projects; lines join projects that share a technology">
<svg><g class="edges">${allEdges.map((_, i) => `<path class="edge" data-e="${i}" />`).join('')}</g><g class="pulses"></g></svg>
${LAYERS.map((l) => `<span class="vf-layer-label" data-layer="${l}">${l === 'Personal' ? 'Personal · latest' : l}</span>`).join('')}
${PROJECTS.map((p) => `<button type="button" class="vf-node" data-id="${p.id}" data-domain="${p.category}">${p.title}</button>`).join('')}
<div class="vf-peek"></div></div>`;

    const net = host.querySelector<HTMLElement>('.vf-net')!;
    const peek = net.querySelector<HTMLElement>('.vf-peek')!;
    const nodeEl = new Map([...net.querySelectorAll<HTMLButtonElement>('.vf-node')].map((n) => [n.dataset.id!, n]));
    const pathEl = [...net.querySelectorAll<SVGPathElement>('.edge')];
    const base = new Map<string, { x: number; y: number; phase: number }>();
    const pos = new Map<string, { x: number; y: number }>();

    let paused = false;
    net.addEventListener('pointerenter', () => (paused = true));
    net.addEventListener('pointerleave', () => (paused = false));
    net.addEventListener('focusin', () => (paused = true));
    net.addEventListener('focusout', () => (paused = false));

    const layout = () => {
        const W = net.clientWidth,
            H = net.clientHeight;
        LAYERS.forEach((layer, li) => {
            const x = W * [0.15, 0.5, 0.85][li];
            net.querySelector<HTMLElement>(`[data-layer="${layer}"]`)!.style.left = `${x}px`;
            const list = PROJECTS.filter((p) => yearOf(p) === layer);
            const gap = Math.min(54, (H - 90) / list.length);
            const top = H / 2 - (gap * (list.length - 1)) / 2 + 14;
            list.forEach((p, i) =>
                base.set(p.id, { x, y: top + i * gap, phase: (i * 1.7 + li * 2.3) % (Math.PI * 2) })
            );
        });
    };

    const place = (t: number) => {
        if (paused) return; // hold still while the visitor is pointing or tabbing: moving targets are hard to hit
        const drift = reduceMotion() ? 0 : 1;
        base.forEach((b, id) => {
            const x = b.x + drift * Math.sin(t / 1400 + b.phase) * 4,
                y = b.y + drift * Math.cos(t / 1700 + b.phase) * 3;
            pos.set(id, { x, y });
            nodeEl.get(id)!.style.left = `${x}px`;
            nodeEl.get(id)!.style.top = `${y}px`;
        });
        allEdges.forEach((e, i) => {
            const a = pos.get(e.a.id)!,
                b = pos.get(e.b.id)!,
                mid = (a.x + b.x) / 2;
            pathEl[i].setAttribute('d', `M ${a.x} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}`);
            pathEl[i].setAttribute('stroke-width', String(1 + e.shared.length * 0.6));
        });
    };

    // Forward pass: a pulse travels Tek1 → Tek2 → Personal along real edges
    const pulses = net.querySelector('.pulses')!;
    const firePulse = () => {
        const first = allEdges.filter((e) => yearOf(e.a) === 'Tek1');
        const e1 = first[Math.floor(Math.random() * first.length)];
        const next = allEdges.filter((e) => e.a.id === e1.b.id);
        const route = [e1, ...(next.length ? [next[Math.floor(Math.random() * next.length)]] : [])];
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '3.5');
        dot.setAttribute('class', 'pulse');
        pulses.appendChild(dot);
        const start = performance.now(),
            leg = 900;
        const step = (now: number) => {
            const k = (now - start) / leg,
                i = Math.floor(k);
            if (i >= route.length) return dot.remove();
            const path = pathEl[allEdges.indexOf(route[i])];
            if (!path || !net.isConnected) return dot.remove();
            const pt = path.getPointAtLength((k - i) * path.getTotalLength());
            dot.setAttribute('cx', String(pt.x));
            dot.setAttribute('cy', String(pt.y));
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const focus = (id: string | null) => {
        net.classList.toggle('focus', id !== null);
        const near = new Set(id ? [id] : []);
        allEdges.forEach((e, i) => {
            const hot = id !== null && (e.a.id === id || e.b.id === id);
            pathEl[i].classList.toggle('hot', hot);
            if (hot) near.add(e.a.id).add(e.b.id);
        });
        nodeEl.forEach((n, nid) => n.classList.toggle('near', near.has(nid)));
        if (!id) return peek.classList.remove('on');
        const p = PROJECTS.find((x) => x.id === id)!,
            at = pos.get(id)!;
        const shared = [...new Set(allEdges.filter((e) => e.a.id === id || e.b.id === id).flatMap((e) => e.shared))];
        peek.innerHTML = `<div class="vr-media"><img src="${still(p)}" alt="" /></div><div class="txt">${metaLine(p)}<p>${oneLiner(p)}</p>
${shared.length ? `<p class="mono">linked by: ${shared.slice(0, 4).join(', ')}</p>` : ''}</div>`;
        // Open in the node's own column, above or below it: only dimmed neighbours get covered, lit edges stay visible
        const w = peek.offsetWidth,
            h = peek.offsetHeight;
        peek.style.left = `${Math.min(net.clientWidth - w - 10, Math.max(10, at.x - w / 2))}px`;
        const above = at.y > net.clientHeight / 2;
        peek.style.top = `${Math.min(net.clientHeight - h - 10, Math.max(10, above ? at.y - 28 - h : at.y + 28))}px`;
        peek.classList.add('on');
    };

    const open = (id: string) => {
        nodeEl.forEach((n, nid) => n.classList.toggle('selected', nid === id));
        detailHost.innerHTML = `<div class="vf-detail">${detail(
            PROJECTS.find((p) => p.id === id)!,
            true
        )}</div>`;
        detailHost.querySelector('.vf-close')!.addEventListener('click', () => {
            detailHost.innerHTML = '';
            nodeEl.forEach((n) => n.classList.remove('selected'));
        });
        detailHost.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
    };

    nodeEl.forEach((n, id) => {
        n.addEventListener('mouseenter', () => focus(id));
        n.addEventListener('focus', () => focus(id));
        n.addEventListener('mouseleave', () => focus(null));
        n.addEventListener('blur', () => focus(null));
        n.addEventListener('click', () => open(id));
    });

    layout();
    window.addEventListener('resize', () => {
        layout();
        const was = paused;
        paused = false;
        place(performance.now());
        paused = was;
    });
    const frame = (t: number) => {
        if (!net.isConnected) return;
        place(t);
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    if (!reduceMotion()) {
        const timer = setInterval(() => (net.isConnected ? firePulse() : clearInterval(timer)), 2600);
    }

    return (domain: string) => {
        net.classList.toggle('dim-domain', domain !== 'all');
        nodeEl.forEach((n) => n.classList.toggle('in-domain', n.dataset.domain === domain));
    };
}

/* ── List view: every project small, one opens big ───────── */

function mountList(host: HTMLElement): (domain: string) => void {
    host.innerHTML = `<div class="vf-list">${PROJECTS.map(
        (
            p
        ) => `<details class="vf-item" name="projects" data-domain="${p.category}"><summary><span><strong>${p.title}</strong><span class="one">${oneLiner(p)}</span></span>
<span class="mono">${DOMAIN_LABEL[p.category]} · ${yearOf(p)}</span></summary><div class="vf-detail">${detail(p, false)}</div></details>`
    ).join('')}</div>`;
    return (domain: string) =>
        host
            .querySelectorAll<HTMLElement>('.vf-item')
            .forEach((i) => (i.hidden = domain !== 'all' && i.dataset.domain !== domain));
}

/* ── Page ────────────────────────────────────────────────── */

/** Mounts the main projects view into `host` and returns its domain filter. */
export type WorkView = (host: HTMLElement, detailHost: HTMLElement) => (domain: string) => void;

export function variantF(
    root: HTMLElement,
    mainView: WorkView = mountNetwork,
    mainLabel = 'Network',
    fullBleed = false
): void {
    const now = EXPERIENCES[0];
    const domains = ['all', ...new Set(PROJECTS.map((p) => p.category))];
    root.innerHTML = `
<div class="vr vf">
  <header class="vr-top"><span class="mono">NIELSEN COMBE-BRACCIALE</span>
    <nav><a href="#work">Work</a><a href="#path">Path</a><a href="#hire">Hire</a></nav></header>
  <section class="vr-hero">
    <canvas aria-label="Value iteration: arrows point toward the cursor, which is the reward. Click to add or remove walls."></canvas>
    <div class="vr-thesis"><h1>I build agents that <em>decide</em> and learn.</h1>
      <p class="mono">value iteration · reward = your cursor · click to add walls</p></div>
    <div class="vf-status"><span class="mono"><span class="vf-live"></span>now</span><strong>${now.title.en.replace(/ \(.*\)/, '')} @ ${now.org}</strong>
      <span class="mono">open to: internship Mar – Aug · freelance</span></div>
  </section>

  ${tree('vf-start', 'What brings you here?', [
      { id: 'work', label: 'See the projects', hint: `${PROJECTS.length} projects, 5 domains` },
      { id: 'hire', label: 'Hiring an intern', hint: 'Mar – Aug, full time' },
      { id: 'freelance', label: 'A freelance project', hint: 'Backend, AI integration' },
      { id: 'path', label: 'The path so far', hint: '2020 → 2029' }
  ])}

  <section class="vr-section" id="path"><div class="vr-head"><h2>The run so far</h2><span class="mono">every checkpoint shipped or earned</span></div>${curve(250)}</section>

  <section class="vr-section" id="work"><div class="vr-head"><h2>Work</h2><div class="vf-tools">
    <div class="vr-branches" data-group="view"><button type="button" data-id="network" aria-pressed="true">${mainLabel}</button><button type="button" data-id="list" aria-pressed="false">List</button></div>
    <div class="vr-branches" data-group="domain">${domains
        .map(
            (d) =>
                `<button type="button" data-id="${d}" aria-pressed="${d === 'all'}">${d === 'all' ? '' : `<span class="vf-domain-dot" data-domain="${d}"></span>`}${d === 'all' ? 'All' : DOMAIN_LABEL[d]}</button>`
        )
        .join('')}</div></div></div>
    <div class="vf-work"></div><div class="vf-detail-host"></div></section>

  <section class="vr-section" id="hire"><div class="vr-head"><h2>Work with me</h2></div>
    ${tree('vf-offer', 'What do you have in mind?', [
        { id: 'full-time', label: "I'm hiring an intern", hint: 'Epitech Tek3 placement' },
        { id: 'freelance', label: 'I have a freelance project', hint: 'B2B, quote on request' }
    ])}<div class="vr-offer-out vf-offer-out">${offer('full-time')}</div></section>

  <footer class="vr-contact"><a href="mailto:nielsen.combe-bracciale@epitech.eu">Email</a><a href="https://github.com/Nexlein">GitHub</a>
    <a href="https://www.linkedin.com/in/nielsen-combebracciale/">LinkedIn</a><a href="/cv.pdf">CV (PDF)</a></footer>
</div>`;

    policyField(root.querySelector('canvas')!);

    // Work: network or list, filtered by domain
    const work = root.querySelector<HTMLElement>('.vf-work')!;
    const detailHost = root.querySelector<HTMLElement>('.vf-detail-host')!;
    let view: 'network' | 'list' = matchMedia('(width <= 760px)').matches ? 'list' : 'network';
    let domain = 'all';
    let filter: (domain: string) => void = noop;
    const showView = () => {
        detailHost.innerHTML = '';
        // Size the container first: the board measures itself when it mounts
        work.classList.toggle('vg-bleed', fullBleed && view === 'network');
        filter = view === 'network' ? mainView(work, detailHost) : mountList(work);
        filter(domain);
        root.querySelectorAll('[data-group="view"] button').forEach((b) =>
            b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.id === view))
        );
    };
    showView();
    root.querySelectorAll<HTMLElement>('.vr-branches[data-group="view"], .vr-branches[data-group="domain"]').forEach(
        (group) =>
            group.addEventListener('click', (e) => {
                const btn = (e.target as HTMLElement).closest('button');
                if (!btn) return;
                group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
                if (group.dataset.group === 'view') {
                    view = btn.dataset.id as 'network' | 'list';
                    showView();
                } else {
                    domain = btn.dataset.id!;
                    filter(domain);
                }
            })
    );

    // Offers tree
    const offerOut = root.querySelector<HTMLElement>('.vf-offer-out')!;
    const offerTree = root.querySelector<HTMLElement>('#vf-offer')!;
    bindTree(offerTree, (id) => (offerOut.innerHTML = offer(id as 'full-time' | 'freelance')), 'full-time');

    // Entry tree under the hero: jump to the section (and pick the offer)
    bindTree(root.querySelector<HTMLElement>('#vf-start')!, (id) => {
        const target = id === 'hire' || id === 'freelance' ? 'hire' : id;
        if (target === 'hire')
            offerTree
                .querySelector<HTMLButtonElement>(`[data-id="${id === 'hire' ? 'full-time' : 'freelance'}"]`)!
                .click();
        root.querySelector(`#${target}`)!.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
    });

    // Curve draws when it scrolls into view
    const chart = root.querySelector('.vr-chart')!;
    new IntersectionObserver(
        (entries, obs) => {
            if (!entries[0].isIntersecting) return;
            chart.classList.add('drawn');
            chart
                .querySelectorAll<SVGGElement>('.cp')
                .forEach((g, i) => (g.style.transitionDelay = `${0.3 + i * 0.25}s`));
            obs.disconnect();
        },
        { threshold: 0.3 }
    ).observe(chart);
}
