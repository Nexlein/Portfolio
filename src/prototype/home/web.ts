// PROTOTYPE — Round 6 (I): cards float constantly, each held by 2–4 spider legs anchored to points on the wall
// (one leg per main skill). Hover (with intent) unfolds the card in place; only that card stops. Layout keeps
// round 5's meaning: direction = similarity, distance from the centre = time.
import './web.css';
import { PROJECTS, projectPath, type ProjectEntry } from '@/data/projects';
import { oneLiner, still } from './round2';
import { variantF } from './round3';
import { ICONS, layout, neighbours, yearOf, type Star } from './space';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const OPEN_W = 330;

function seeded(seed: number): () => number {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

interface Leg {
    x: number;
    y: number;
    skill: string;
}

/** 2–4 anchors per card on the wall around it, one per main skill. Seeded: stable between visits. */
function legsFor(star: Star, i: number, W: number, H: number): Leg[] {
    const rnd = seeded(97 + i * 31);
    const skills = star.p.tags.slice(0, Math.min(4, Math.max(2, star.p.tags.length)));
    const base = rnd() * Math.PI * 2;
    return skills.map((skill, k) => {
        const angle = base + (k / skills.length) * Math.PI * 2 + (rnd() - 0.5) * 0.9;
        const dist = 110 + rnd() * 110;
        return {
            skill,
            x: Math.min(W - 20, Math.max(20, star.x + Math.cos(angle) * dist * 1.25)),
            y: Math.min(H - 20, Math.max(20, star.y + Math.sin(angle) * dist * 0.8))
        };
    });
}

function cardHtml(p: ProjectEntry): string {
    const related = neighbours(p)
        .slice(0, 2)
        .map(({ q }) => q.title)
        .join(', ');
    return `<a class="vi-card" href="${projectPath(p.id)}" data-id="${p.id}" data-domain="${p.category}">
<span class="head"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[p.category]}</svg></span>
<span class="txt"><strong>${p.title}</strong><span class="mono">${yearOf(p)} · ${p.tags[0]}</span></span></span>
<span class="more"><span class="inner">
  <span class="media"><img src="${still(p)}" alt="" loading="lazy" /></span>
  <span class="line">${oneLiner(p)}</span>
  <span class="mono related">close to: ${related}</span>
  <span class="go">Open project <span aria-hidden="true">→</span></span>
</span></span></a>`;
}

export function mountWeb(host: HTMLElement): (domain: string) => void {
    host.innerHTML = `<div class="vi-web" aria-label="Projects floating on a web. Hover or focus a project to unfold it; select it to open its page.">
<svg><g class="legs"></g><g class="tips"></g></svg>
<div class="vi-core"><span class="dot"></span><span class="mono">Nielsen · ${PROJECTS.length} projects</span></div>
${PROJECTS.map(cardHtml).join('')}
<p class="vi-legend mono">closer to the centre = more recent · similar projects drift together · hover to unfold</p></div>`;

    const web = host.querySelector<HTMLElement>('.vi-web')!;
    const legsG = web.querySelector('.legs')!;
    const tipsG = web.querySelector('.tips')!;
    const core = web.querySelector<HTMLElement>('.vi-core')!;
    const cards = [...web.querySelectorAll<HTMLAnchorElement>('.vi-card')];

    interface State {
        star: Star;
        el: HTMLAnchorElement;
        legs: Leg[];
        lines: SVGLineElement[];
        tips: SVGGElement[];
        clock: number; // each card keeps its own time, so only the hovered one stops
        speed: number;
        hold: boolean;
        x: number;
        y: number;
    }
    let states: State[] = [];

    const build = () => {
        const W = web.clientWidth,
            H = web.clientHeight;
        const stars = layout(W, H);
        legsG.innerHTML = '';
        tipsG.innerHTML = '';
        states = stars.map((star, i) => {
            const legs = legsFor(star, i, W, H);
            const lines = legs.map(() => {
                const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                l.setAttribute('class', 'leg');
                legsG.appendChild(l);
                return l;
            });
            const tips = legs.map((leg) => {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('class', 'tip');
                g.setAttribute('transform', `translate(${leg.x} ${leg.y})`);
                g.innerHTML = `<circle r="2.2" /><text y="-8">${leg.skill}</text>`;
                tipsG.appendChild(g);
                return g;
            });
            const el = cards.find((c) => c.dataset.id === star.p.id)!;
            return { star, el, legs, lines, tips, clock: i * 1700, speed: 1, hold: false, x: star.x, y: star.y };
        });
        core.style.left = `${W / 2}px`;
        core.style.top = `${H / 2}px`;
    };

    let visible = true,
        last = performance.now();
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(web);

    const frame = (now: number) => {
        if (!web.isConnected) return;
        const dt = Math.min(50, now - last);
        last = now;
        if (visible) {
            const frozen = reduceMotion();
            for (const s of states) {
                s.speed += ((s.hold || frozen ? 0 : 1) - s.speed) * 0.08; // ease to a stop, ease back
                s.clock += dt * s.speed;
                const t = s.clock / 1000,
                    ph = s.star.phase;
                // Two layered waves per axis, periods ~9-16 s: slow enough to stay calm, fast enough to read as floating
                s.x = s.star.x + Math.sin(t * 0.68 + ph) * 8 + Math.sin(t * 0.41 + ph * 1.7) * 4;
                s.y = s.star.y + Math.cos(t * 0.55 + ph) * 6 + Math.sin(t * 0.39 + ph * 0.6) * 3;
                s.el.style.setProperty('--x', `${s.x}px`);
                s.el.style.setProperty('--y', `${s.y}px`);
                s.lines.forEach((l, k) => {
                    l.setAttribute('x1', String(s.x));
                    l.setAttribute('y1', String(s.y));
                    l.setAttribute('x2', String(s.legs[k].x));
                    l.setAttribute('y2', String(s.legs[k].y));
                });
            }
        }
        requestAnimationFrame(frame);
    };

    // Unfold in place, toward the free side, with hover intent so brushing past does nothing
    let opened: State | null = null;
    const open = (s: State) => {
        if (opened && opened !== s) close(opened);
        opened = s;
        s.hold = true;
        const W = web.clientWidth,
            H = web.clientHeight;
        s.el.dataset.dir = s.star.y > H * 0.58 ? 'up' : 'down';
        const overflow = Math.max(0, s.star.x + OPEN_W / 2 + 16 - W) - Math.max(0, OPEN_W / 2 + 16 - s.star.x);
        s.el.style.setProperty('--dx', `${-overflow}px`);
        s.el.classList.add('open');
        web.classList.add('focus');
        s.lines.forEach((l) => l.classList.add('hot'));
        s.tips.forEach((t) => t.classList.add('on'));
    };
    const close = (s: State) => {
        s.hold = false;
        s.el.classList.remove('open');
        s.lines.forEach((l) => l.classList.remove('hot'));
        s.tips.forEach((t) => t.classList.remove('on'));
        if (opened === s) {
            opened = null;
            web.classList.remove('focus');
        }
    };

    let timer = 0;
    const later = (fn: () => void, ms: number) => {
        clearTimeout(timer);
        timer = window.setTimeout(fn, ms);
    };
    cards.forEach((el) => {
        const state = () => states.find((s) => s.el === el)!;
        el.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'touch') return;
            state().hold = true; // stop drifting under the cursor right away
            later(() => open(state()), 120);
        });
        el.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'touch') return;
            later(() => close(state()), 160);
        });
        el.addEventListener('focus', () => open(state()));
        el.addEventListener('blur', () => close(state()));
        // Touch: first tap unfolds, second tap opens the page
        el.addEventListener('click', (e) => {
            if (!el.classList.contains('open')) {
                e.preventDefault();
                open(state());
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
        cards.forEach((c) => c.classList.toggle('in-domain', c.dataset.domain === domain));
    };
}

export const variantI = (root: HTMLElement) => variantF(root, (host) => mountWeb(host), 'Web', true);
