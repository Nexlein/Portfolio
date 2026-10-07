import './board.css';
// PROTOTYPE — Round 4 (G): projects scattered across the full width, hanging by threads from skill pins.
// Pins = technologies used by 2+ projects; a project hangs from every pin it uses, so clusters form on their own.
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { metaLine, oneLiner, still } from './round2';
import { detail, variantF } from './round3';

const PIN_LABEL: Record<string, string> = {
    python: 'Python',
    'c++': 'C++',
    c: 'C',
    'reinforcement learning': 'RL',
    algorithms: 'Algorithms',
    oop: 'OOP',
    graphics: 'Graphics',
    'data science': 'Data Science',
    docker: 'Docker',
    security: 'Security',
    simulation: 'Simulation',
    infra: 'Infra & CI'
};
/** Concept pin for projects that share no technology with another one (Octopus): infra automation. */
const INFRA = new Set(['mymarvin', 'octopus']);

const ICONS: Record<ProjectEntry['category'], string> = {
    ai: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8M17 8l-4 8"/>',
    architecture: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    systems: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
    graphical: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/>',
    devops: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'
};

function pinsOf(p: ProjectEntry): string[] {
    const out = new Set<string>();
    for (const raw of p.tags) {
        for (const part of raw.toLowerCase().split('/')) {
            const t = ['rl', 'gymnasium', 'stable-baselines3'].includes(part.trim())
                ? 'reinforcement learning'
                : part.trim();
            if (t in PIN_LABEL) out.add(t);
        }
    }
    if (INFRA.has(p.id)) out.add('infra');
    return [...out];
}

interface Body {
    id: string;
    kind: 'pin' | 'card';
    x: number;
    y: number;
    vx: number;
    vy: number;
    phase: number;
}

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Seeded so the board looks the same on every visit. */
function seeded(seed: number): () => number {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** Where each skill sits on the board (0..1). Related skills are neighbours, so their projects cluster. */
const PIN_AT: Record<string, [number, number]> = {
    c: [0.07, 0.3],
    algorithms: [0.27, 0.14],
    'c++': [0.2, 0.62],
    oop: [0.08, 0.86],
    simulation: [0.36, 0.5],
    graphics: [0.3, 0.88],
    security: [0.5, 0.1],
    python: [0.6, 0.46],
    'data science': [0.58, 0.86],
    'reinforcement learning': [0.8, 0.18],
    docker: [0.84, 0.62],
    infra: [0.94, 0.88]
};

function simulate(W: number, H: number, links: [string, string][]): Map<string, Body> {
    const rnd = seeded(42);
    const bodies = new Map<string, Body>();
    // Pins are fixed: they give the board its structure and spread it across the full width
    for (const [id, [px, py]] of Object.entries(PIN_AT)) {
        bodies.set(id, {
            id,
            kind: 'pin',
            x: 60 + px * (W - 120),
            y: 40 + py * (H - 80),
            vx: 0,
            vy: 0,
            phase: rnd() * 6
        });
    }
    for (const p of PROJECTS) {
        const ps = pinsOf(p).map((id) => bodies.get(id)!);
        bodies.set(p.id, {
            id: p.id,
            kind: 'card',
            x: ps.reduce((s, b) => s + b.x, 0) / ps.length + (rnd() - 0.5) * 120,
            y: ps.reduce((s, b) => s + b.y, 0) / ps.length + (rnd() - 0.5) * 120,
            vx: 0,
            vy: 0,
            phase: rnd() * 6
        });
    }
    const cards = [...bodies.values()].filter((b) => b.kind === 'card');
    const pins = [...bodies.values()].filter((b) => b.kind === 'pin');
    const CARD_W = 196,
        CARD_H = 56,
        GAP = 26,
        REST = 150;
    for (let step = 0; step < 900; step++) {
        const heat = Math.max(0.05, 1 - step / 900);
        // Each card hangs from its pins
        for (const [cardId, pinId] of links) {
            const a = bodies.get(cardId)!,
                b = bodies.get(pinId)!;
            const dx = b.x - a.x,
                dy = b.y - a.y,
                d = Math.hypot(dx, dy) || 1,
                f = (d - REST) * 0.01;
            a.vx += (dx / d) * f;
            a.vy += (dy / d) * f;
        }
        // Cards keep their distance (long range) and never overlap (box collision)
        for (let i = 0; i < cards.length; i++) {
            for (let j = i + 1; j < cards.length; j++) {
                const a = cards[i],
                    b = cards[j];
                const dx = b.x - a.x,
                    dy = b.y - a.y,
                    d = Math.hypot(dx, dy) || 1;
                if (d < 300) {
                    const f = ((300 - d) / 300) * 1.4;
                    a.vx -= (dx / d) * f;
                    a.vy -= (dy / d) * f;
                    b.vx += (dx / d) * f;
                    b.vy += (dy / d) * f;
                }
                const ox = CARD_W + GAP - Math.abs(dx),
                    oy = CARD_H + GAP - Math.abs(dy);
                if (ox > 0 && oy > 0) {
                    if (ox / CARD_W < oy / CARD_H) {
                        a.x -= (ox / 2) * Math.sign(dx || 1);
                        b.x += (ox / 2) * Math.sign(dx || 1);
                    } else {
                        a.y -= (oy / 2) * Math.sign(dy || 1);
                        b.y += (oy / 2) * Math.sign(dy || 1);
                    }
                }
            }
            // ...and stay off the pin labels
            for (const pin of pins) {
                const c = cards[i],
                    dx = c.x - pin.x,
                    dy = c.y - pin.y;
                const ox = CARD_W / 2 + 70 - Math.abs(dx),
                    oy = CARD_H / 2 + 22 - Math.abs(dy);
                if (ox > 0 && oy > 0) {
                    if (ox < oy) c.x += ox * Math.sign(dx || 1);
                    else c.y += oy * Math.sign(dy || 1);
                }
            }
        }
        for (const c of cards) {
            c.x += c.vx * heat * 4;
            c.y += c.vy * heat * 4;
            c.vx *= 0.7;
            c.vy *= 0.7;
            c.x = Math.min(W - CARD_W / 2 - 14, Math.max(CARD_W / 2 + 14, c.x));
            c.y = Math.min(H - CARD_H / 2 - 30, Math.max(CARD_H / 2 + 30, c.y));
        }
    }
    // Final collision-only passes: clamping to the edges can re-create small overlaps
    for (let pass = 0; pass < 40; pass++) {
        for (let i = 0; i < cards.length; i++) {
            for (let j = i + 1; j < cards.length; j++) {
                const a = cards[i],
                    b = cards[j],
                    dx = b.x - a.x,
                    dy = b.y - a.y;
                const ox = CARD_W + GAP - Math.abs(dx),
                    oy = CARD_H + GAP - Math.abs(dy);
                if (ox <= 0 || oy <= 0) continue;
                if (ox / CARD_W < oy / CARD_H) {
                    a.x -= (ox / 2) * Math.sign(dx || 1);
                    b.x += (ox / 2) * Math.sign(dx || 1);
                } else {
                    a.y -= (oy / 2) * Math.sign(dy || 1);
                    b.y += (oy / 2) * Math.sign(dy || 1);
                }
            }
        }
        for (const c of cards) {
            c.x = Math.min(W - CARD_W / 2 - 14, Math.max(CARD_W / 2 + 14, c.x));
            c.y = Math.min(H - CARD_H / 2 - 30, Math.max(CARD_H / 2 + 30, c.y));
        }
    }
    return bodies;
}

export function mountBoard(host: HTMLElement, detailHost: HTMLElement): (domain: string) => void {
    const links: [string, string][] = PROJECTS.flatMap((p) => pinsOf(p).map((pin): [string, string] => [p.id, pin]));
    host.innerHTML = `<div class="vg-board" data-threads="synapse" aria-label="Projects hanging from the skills they use. Hover a skill to see where it was used; select a project to open it.">
<svg><g class="threads">${links.map(([c, p], i) => `<path class="thread" data-i="${i}" data-card="${c}" data-pin="${p}" />`).join('')}</g><g class="pulses"></g></svg>
${Object.entries(PIN_LABEL)
    .map(
        ([id, label]) =>
            `<button type="button" class="vg-pin" data-pin="${id}"><span class="ring"></span>${label}</button>`
    )
    .join('')}
${PROJECTS.map(
    (
        p
    ) => `<button type="button" class="vg-card" data-id="${p.id}" data-domain="${p.category}"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[p.category]}</svg></span>
<span class="txt"><strong>${p.title}</strong><span class="mono">${p.year ?? 'Tek2'} · ${p.tags[0]}</span></span></button>`
).join('')}
<div class="vf-peek vg-peek"></div>
<div class="vg-threads-toggle vr-branches" data-group="threads" role="group" aria-label="Thread style">
  <button type="button" data-id="synapse" aria-pressed="true">Synapse</button><button type="button" data-id="spider" aria-pressed="false">Spider</button></div></div>`;

    const board = host.querySelector<HTMLElement>('.vg-board')!;
    const peek = board.querySelector<HTMLElement>('.vg-peek')!;
    const cards = new Map([...board.querySelectorAll<HTMLButtonElement>('.vg-card')].map((c) => [c.dataset.id!, c]));
    const pins = new Map([...board.querySelectorAll<HTMLButtonElement>('.vg-pin')].map((c) => [c.dataset.pin!, c]));
    const threads = [...board.querySelectorAll<SVGPathElement>('.thread')];
    let bodies = new Map<string, Body>();
    const pos = new Map<string, { x: number; y: number }>();
    let paused = false;

    const layout = () => (bodies = simulate(board.clientWidth, board.clientHeight, links));

    const place = (t: number) => {
        const drift = reduceMotion() || paused ? 0 : 1;
        bodies.forEach((b, id) => {
            const amp = b.kind === 'card' ? 6 : 1.5;
            const x = b.x + drift * Math.sin(t / 1600 + b.phase) * amp,
                y = b.y + drift * Math.cos(t / 2100 + b.phase) * amp;
            if (!paused || !pos.has(id)) pos.set(id, { x, y });
            const el = b.kind === 'card' ? cards.get(id)! : pins.get(id)!;
            el.style.left = `${pos.get(id)!.x}px`;
            el.style.top = `${pos.get(id)!.y}px`;
        });
        const spider = board.dataset.threads === 'spider';
        threads.forEach((path) => {
            const a = pos.get(path.dataset.card!)!,
                b = pos.get(path.dataset.pin!)!;
            if (spider) {
                path.setAttribute('d', `M ${a.x} ${a.y} L ${b.x} ${b.y}`);
            } else {
                // Synapse: a soft curve that sags sideways, like a dendrite
                const mx = (a.x + b.x) / 2,
                    my = (a.y + b.y) / 2,
                    nx = -(b.y - a.y) * 0.18,
                    ny = (b.x - a.x) * 0.18;
                path.setAttribute('d', `M ${a.x} ${a.y} Q ${mx + nx} ${my + ny} ${b.x} ${b.y}`);
            }
        });
    };

    // Data flowing from a skill to a project that uses it
    const pulses = board.querySelector('.pulses')!;
    const firePulse = () => {
        const path = threads[Math.floor(Math.random() * threads.length)];
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '3');
        dot.setAttribute('class', 'pulse');
        pulses.appendChild(dot);
        const start = performance.now();
        const step = (now: number) => {
            const k = (now - start) / 1100;
            if (k >= 1 || !board.isConnected) return dot.remove();
            const len = path.getTotalLength(),
                pt = path.getPointAtLength((1 - k) * len); // pin end → card end
            dot.setAttribute('cx', String(pt.x));
            dot.setAttribute('cy', String(pt.y));
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const light = (cardIds: string[], pinIds: string[], focusCard?: string) => {
        board.classList.toggle('focus', cardIds.length > 0 || pinIds.length > 0);
        threads.forEach((t) =>
            t.classList.toggle('hot', pinIds.includes(t.dataset.pin!) && cardIds.includes(t.dataset.card!))
        );
        cards.forEach((c, id) => c.classList.toggle('lit', cardIds.includes(id)));
        pins.forEach((p, id) => p.classList.toggle('lit', pinIds.includes(id)));
        if (!focusCard) return peek.classList.remove('on');
        const p = PROJECTS.find((x) => x.id === focusCard)!,
            at = pos.get(focusCard)!;
        peek.innerHTML = `<div class="vr-media"><img src="${still(p)}" alt="" /></div><div class="txt">${metaLine(p)}<p>${oneLiner(p)}</p>
<p class="mono">skills: ${pinsOf(p)
            .map((id) => PIN_LABEL[id])
            .join(', ')}</p></div>`;
        const w = peek.offsetWidth,
            h = peek.offsetHeight;
        const right = at.x < board.clientWidth / 2; // open toward the emptier half
        peek.style.left = `${Math.min(board.clientWidth - w - 12, Math.max(12, right ? at.x + 120 : at.x - 120 - w))}px`;
        peek.style.top = `${Math.min(board.clientHeight - h - 12, Math.max(12, at.y - h / 2))}px`;
        peek.classList.add('on');
    };

    const focusCard = (id: string | null) => {
        if (!id) return light([], []);
        const own = pinsOf(PROJECTS.find((p) => p.id === id)!);
        light([id], own, id);
    };
    const focusPin = (pin: string | null) => {
        if (!pin) return light([], []);
        light(
            PROJECTS.filter((p) => pinsOf(p).includes(pin)).map((p) => p.id),
            [pin]
        );
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
        c.addEventListener('mouseenter', () => focusCard(id));
        c.addEventListener('focus', () => focusCard(id));
        c.addEventListener('mouseleave', () => focusCard(null));
        c.addEventListener('blur', () => focusCard(null));
        c.addEventListener('click', () => open(id));
    });
    pins.forEach((p, id) => {
        p.addEventListener('mouseenter', () => focusPin(id));
        p.addEventListener('focus', () => focusPin(id));
        p.addEventListener('mouseleave', () => focusPin(null));
        p.addEventListener('blur', () => focusPin(null));
    });

    board.querySelector('.vg-threads-toggle')!.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button');
        if (!btn) return;
        e.stopPropagation();
        board.dataset.threads = btn.dataset.id;
        board
            .querySelectorAll('.vg-threads-toggle button')
            .forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    });

    // Hold still while the visitor points or tabs: moving targets are hard to hit
    board.addEventListener('pointerenter', () => (paused = true));
    board.addEventListener('pointerleave', () => (paused = false));
    board.addEventListener('focusin', () => (paused = true));
    board.addEventListener('focusout', () => (paused = false));

    layout();
    window.addEventListener('resize', () => {
        layout();
        pos.clear();
    });
    const frame = (t: number) => {
        if (!board.isConnected) return;
        place(t);
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    if (!reduceMotion()) {
        const timer = setInterval(() => (board.isConnected ? firePulse() : clearInterval(timer)), 1300);
    }

    return (domain: string) => {
        board.classList.toggle('dim-domain', domain !== 'all');
        cards.forEach((c) => c.classList.toggle('in-domain', c.dataset.domain === domain));
    };
}

export const variantG = (root: HTMLElement) => variantF(root, mountBoard, 'Board', true);
