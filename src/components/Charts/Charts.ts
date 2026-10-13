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
            cross = svg.querySelector('.cross')!,
            hit = svg.querySelector('.hit')!;
        const samples = pathSamples(points, t0, now, total);
        hit.addEventListener('pointermove', (e) => {
            const r = svg.getBoundingClientRect(),
                sx = (((e as PointerEvent).clientX - r.left) / r.width) * PATH.W;
            const near = samples.reduce((a, b) => (Math.abs(b[0] - sx) < Math.abs(a[0] - sx) ? b : a));
            const time = t0 + ((near[0] - PATH.L) / (PATH.W - PATH.L - PATH.R)) * (now - t0);
            cross.setAttribute('visibility', 'visible');
            cross.querySelector('.cross-x')!.setAttribute('x1', near[0].toFixed(1));
            cross.querySelector('.cross-x')!.setAttribute('x2', near[0].toFixed(1));
            cross.querySelector('.cross-dot')!.setAttribute('cx', near[0].toFixed(1));
            cross.querySelector('.cross-dot')!.setAttribute('cy', near[1].toFixed(1));
            const last = points.reduce<Point>((l, p) => (p.t <= time && p.m ? p : l), points[0]);
            const what = last.m?.checkpoint
                ? last.m.checkpoint.label[lang]
                : last.m?.project
                  ? i18n.t('home.path.shipped').replace('{p}', last.m.project.title)
                  : '';
            tip.innerHTML = `<span class="mono">${monthName(time, lang)}</span><strong>${i18n.t('home.path.skills').replace('{n}', String(valueAt(points, time)))}</strong><span>${what}</span>`;
            tip.hidden = false;
            tip.style.left = `${(near[0] / PATH.W) * 100}%`;
            tip.style.top = `${(near[1] / PATH.H) * 100}%`;
        });
        hit.addEventListener('pointerleave', () => {
            cross.setAttribute('visibility', 'hidden');
            tip.hidden = true;
        });
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

const idOf = (e: Event) => (e.target as Element).closest<HTMLElement>('[data-cp]')?.dataset.cp ?? null;

/**
 * The path chart and the experience list under it are one story: hovering or focusing an entry of the list lights
 * its checkpoint on the chart (and the other way round); the rest dims. Marks come and go with the range
 * buttons, so everything is looked up at the time of the event.
 */
export function initPathLinks(): void {
    const section = document.getElementById('path');
    if (!section) return;
    const list = section.querySelector<HTMLElement>('.experience');
    const toggle = list?.querySelector<HTMLButtonElement>('.exp-toggle');
    const fold = (open: boolean) => {
        list!.classList.toggle('open', open);
        toggle!.setAttribute('aria-expanded', String(open));
        toggle!.textContent = toggle!.dataset[open ? 'less' : 'more']!;
    };
    if (toggle) {
        toggle.hidden = false;
        toggle.addEventListener('click', () => fold(!list!.classList.contains('open')));
    }
    const light = (id: string | null) => {
        // A checkpoint whose entry is folded away opens the fold
        if (toggle && id && list!.querySelector(`.exp-fold [data-cp="${CSS.escape(id)}"]`)) fold(true);
        const on = id ? section.querySelectorAll(`[data-cp="${CSS.escape(id)}"]`) : [];
        section.querySelectorAll('.marks, .experience').forEach((g) => g.classList.toggle('lit', on.length > 0));
        section.querySelectorAll('[data-cp]').forEach((n) => n.classList.toggle('on', [...on].includes(n)));
    };
    section.addEventListener('pointerover', (e) => light(idOf(e)));
    section.addEventListener('pointerout', (e) => {
        if (!(e.relatedTarget as Element | null)?.closest?.('[data-cp]')) light(null);
    });
    section.addEventListener('focusin', (e) => light(idOf(e)));
    section.addEventListener('focusout', () => light(null));
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
