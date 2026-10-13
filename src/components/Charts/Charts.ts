/**
 * Interactions on the build-time charts: the path chart's range buttons and crosshair, the numbers deck's
 * arrows, and count-ups when they come into view. The SVG is already in the page; this only adds behaviour.
 */
import { i18n } from '@/core/i18n';
import { PROJECTS } from '@/data/projects';
import { skillSeries, valueAt, type Point } from './data';
import { monthName, PATH, pathSamples, pathSvg } from './render';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Count up `.count[data-to]` from 0 once. */
export function countUp(el: HTMLElement): void {
    if (reduced()) return;
    const to = Number(el.dataset.to),
        start = performance.now();
    const step = (time: number) => {
        const u = Math.min(1, (time - start) / 1100);
        el.textContent = String(Math.round(to * (1 - (1 - u) ** 3)));
        if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

export function initPathChart(): void {
    const host = document.querySelector<HTMLElement>('.path-chart');
    if (!host) return;
    const lang = i18n.getLang();
    const now = Number(host.dataset.now);
    const points: Point[] = skillSeries(PROJECTS, now);
    const total = points[points.length - 1].v;
    const plot = host.querySelector<HTMLElement>('.path-plot')!,
        tip = host.querySelector<HTMLElement>('.path-tip')!;
    let t0 = points[0].t;

    const bind = () => {
        const svg = plot.querySelector('svg')!,
            cross = svg.querySelector('.cross')!;
        const hide = () => {
            cross.setAttribute('visibility', 'hidden');
            tip.hidden = true;
        };
        const samples = pathSamples(points, t0, now, total);
        const span = PATH.W - PATH.L - PATH.R;
        // The marks sit above the plot, so the crosshair listens on the whole svg and the plot's own bounds decide
        svg.addEventListener('pointermove', (e) => {
            const r = svg.getBoundingClientRect(),
                sx = ((e.clientX - r.left) / r.width) * PATH.W;
            if (sx < PATH.L || sx > PATH.L + span) return hide();
            // Follow the pointer along the line: interpolate between the two samples around it
            let i = 1;
            while (i < samples.length - 1 && samples[i][0] < sx) i++;
            const [x0, y0] = samples[i - 1],
                [x1, y1] = samples[i];
            const py = x1 === x0 ? y1 : y0 + (y1 - y0) * Math.min(1, Math.max(0, (sx - x0) / (x1 - x0)));
            const time = t0 + ((sx - PATH.L) / span) * (now - t0);
            cross.setAttribute('visibility', 'visible');
            const line = cross.querySelector('.cross-x')!;
            line.setAttribute('x1', sx.toFixed(1));
            line.setAttribute('x2', sx.toFixed(1));
            line.setAttribute('y1', py.toFixed(1));
            const dot = cross.querySelector('.cross-dot')!;
            dot.setAttribute('cx', sx.toFixed(1));
            dot.setAttribute('cy', py.toFixed(1));
            const last = points.reduce<Point>((l, p) => (p.t <= time && p.m ? p : l), points[0]);
            const what = last.m?.checkpoint
                ? last.m.checkpoint.label[lang]
                : last.m?.project
                  ? i18n.t('home.path.shipped').replace('{p}', last.m.project.title)
                  : '';
            tip.innerHTML = `<span class="mono">${monthName(time, lang)}</span><strong>${i18n.t('home.path.skills').replace('{n}', String(valueAt(points, time)))}</strong><span>${what}</span>`;
            tip.hidden = false;
            tip.style.left = `${(sx / PATH.W) * 100}%`;
            tip.style.top = `${(py / PATH.H) * 100}%`;
        });
        svg.addEventListener('pointerleave', hide);
    };

    host.querySelectorAll<HTMLButtonElement>('.path-range button').forEach((b) =>
        b.addEventListener('click', () => {
            host.querySelectorAll('.path-range button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
            t0 = b.dataset.range === 'max' ? points[0].t : now - Number(b.dataset.range);
            plot.querySelector('svg')!.outerHTML = pathSvg(lang, points, t0, now);
            host.classList.remove('drawn');
            void host.offsetWidth; // restart the draw-in
            host.classList.add('drawn');
            bind();
        })
    );
    bind();
}

const inside = (el: EventTarget | null) => (el as Element | null)?.closest?.('.path-chart, .exp-card');

const STEP_MS = 6500;

/**
 * The story under the path chart: one checkpoint is selected at a time, lit on the chart and told in the panel
 * below. It moves on by itself while it is on screen and untouched; a mouse over a checkpoint selects it for as
 * long as it stays there, and leaving resumes from that point with a full step. Taps, the arrows and the range buttons work too
 * (marks come and go with the range, so they are looked up each time). Never moves on its own with reduced motion.
 */
export function initPathStory(): void {
    const section = document.getElementById('path');
    const card = section?.querySelector<HTMLElement>('.exp-card');
    if (!section || !card) return;
    const nav = card.querySelector<HTMLElement>('.exp-nav')!,
        count = card.querySelector<HTMLElement>('.exp-count')!;
    nav.hidden = false;
    card.classList.add('live');
    let current = '',
        timer = 0,
        visible = false,
        held = false;

    const ids = () => [...section.querySelectorAll<SVGElement>('.path-svg .mark')].map((m) => m.dataset.cp!);
    // Every call restarts both the timer and the fill line, so they never drift apart
    const arm = () => {
        clearTimeout(timer);
        const run = visible && !held && !document.hidden && !reduced();
        card.classList.remove('playing');
        void card.offsetWidth;
        card.classList.toggle('playing', run);
        if (run) timer = window.setTimeout(() => step(1), STEP_MS);
    };
    function select(id: string, force = false) {
        const all = ids();
        const next = all.includes(id) ? id : all[0];
        if (next === current && !force) return;
        current = next;
        section!.querySelector('.marks')?.classList.add('lit');
        section!.querySelectorAll<HTMLElement | SVGElement>('[data-cp]').forEach((n) => {
            n.classList.toggle('on', n.dataset.cp === current);
        });
        count.textContent = `${all.indexOf(current) + 1} / ${all.length}`;
        arm();
    }
    function step(dir: number) {
        const all = ids();
        select(all[(all.indexOf(current) + dir + all.length) % all.length]);
    }

    section.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const mark = (e.target as Element).closest<SVGElement>('.mark[data-cp]');
        if (mark) select(mark.dataset.cp!);
        if (inside(e.target)) {
            held = true;
            arm();
        }
    });
    section.addEventListener('pointerout', (e) => {
        if (e.pointerType !== 'mouse' || inside(e.relatedTarget)) return;
        held = card.matches(':has(:focus-visible)');
        arm();
    });
    section.addEventListener('click', (e) => {
        const mark = (e.target as Element).closest<SVGElement>('.mark[data-cp]');
        if (mark) select(mark.dataset.cp!);
    });
    card.addEventListener('focusin', (e) => {
        if (!(e.target as Element).matches(':focus-visible')) return;
        held = true;
        arm();
    });
    card.addEventListener('focusout', () => {
        held = false;
        arm();
    });
    nav.querySelector('.exp-prev')!.addEventListener('click', () => step(-1));
    nav.querySelector('.exp-next')!.addEventListener('click', () => step(1));
    new MutationObserver(() => select(current, true)).observe(section.querySelector('.path-plot')!, {
        childList: true
    });
    document.addEventListener('visibilitychange', () => arm());
    new IntersectionObserver(([e]) => ((visible = e.isIntersecting), arm()), { threshold: 0.5 }).observe(card);
    select(ids()[0], true);
}

const DECK_MS = 6500;

/**
 * The numbers as a deck: one chart in front, two peeking behind. Arrows, the index on the left and a click on
 * the deck bring another one forward; it also turns by itself while it is on screen and untouched (never with
 * reduced motion). Without JS the cards stay a plain grid.
 */
export function initNumbers(): void {
    const root = document.querySelector<HTMLElement>('.numbers');
    const stage = root?.querySelector<HTMLElement>('.numbers-row');
    const nav = root?.querySelector<HTMLElement>('.numbers-nav');
    if (!root || !stage || !nav) return;
    const cards = [...stage.querySelectorAll<HTMLElement>('.chart-card')];
    const n = cards.length;
    const index = root.querySelector<HTMLElement>('.numbers-index')!;
    root.classList.add('deck');
    nav.hidden = false;
    cards.forEach((c) => c.classList.remove('reveal'));
    index.append(
        ...cards.map((c, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.innerHTML = `<span>${c.querySelector('.card-k')!.textContent}</span><small>${c.querySelector('.card-v')!.textContent}</small>`;
            b.addEventListener('click', () => show(i, true));
            return b;
        })
    );
    const items = [...index.children] as HTMLButtonElement[];
    let cur = -1,
        timer = 0,
        visible = false,
        held = false;

    const arm = () => {
        clearTimeout(timer);
        const run = visible && !held && !document.hidden && !reduced();
        root.classList.remove('playing');
        void root.offsetWidth; // restart the fill line together with the timer
        root.classList.toggle('playing', run);
        if (run) timer = window.setTimeout(() => show(cur + 1), DECK_MS);
    };
    function show(to: number, user = false) {
        const next = (to + n) % n;
        if (next === cur) return;
        const prev = cur;
        cur = next;
        cards.forEach((c, i) => {
            const d = (i - cur + n) % n;
            c.dataset.pos = d < 3 ? String(d) : 'back';
            c.inert = d !== 0;
            c.classList.toggle('leaving', i === prev && !user);
        });
        const front = cards[cur];
        if (!front.classList.contains('in')) {
            front.classList.add('in');
            front.querySelectorAll<HTMLElement>('.count').forEach(countUp);
        }
        items.forEach((b, i) => b.toggleAttribute('aria-current', i === cur));
        arm();
    }
    nav.querySelector('.numbers-prev')!.addEventListener('click', () => show(cur - 1, true));
    nav.querySelector('.numbers-next')!.addEventListener('click', () => show(cur + 1, true));
    stage.addEventListener('click', (e) => {
        const card = (e.target as Element).closest<HTMLElement>('.chart-card');
        if (card && card !== cards[cur]) show(cards.indexOf(card), true);
    });
    for (const ev of ['pointerenter', 'focusin'] as const) root.addEventListener(ev, () => ((held = true), arm()));
    for (const ev of ['pointerleave', 'focusout'] as const)
        root.addEventListener(ev, () => ((held = root.matches(':focus-within')), arm()));
    document.addEventListener('visibilitychange', arm);
    new IntersectionObserver(([e]) => ((visible = e.isIntersecting), arm()), { threshold: 0.4 }).observe(root);
    show(0);
}

/** Reveal animations, count-ups and the chart draw-in start once each block comes into view. */
export function initReveals(): void {
    const io = new IntersectionObserver(
        (entries) =>
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const n = e.target as HTMLElement;
                n.classList.add('in', 'drawn');
                n.querySelectorAll<HTMLElement>('.chart-card .count, .path-total .count').forEach(countUp);
                io.unobserve(n);
            }),
        { rootMargin: '0px 0px -12% 0px' }
    );
    document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}
