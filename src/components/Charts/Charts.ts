/**
 * Interactions on the build-time charts: the path chart's range buttons and crosshair, and the numbers deck's
 * arrows. The SVG is already in the page; this only adds behaviour (count-ups and reveals: src/ui/reveal.ts).
 */
import { i18n } from '@/core/i18n';
import { prefersReducedMotion as reduced } from '@/ui/motion';
import { countUp } from '@/ui/reveal';
import { PROJECTS } from '@/data/projects';
import { RANGES, rangeStart, schoolYearAt, skillSeries, valueAt, yDomain, type Point } from './data';
import { changeText, monthName, PATH, pathSamples, pathSvg, phaseLabel } from './render';

/** How far (in chart units) the crosshair reaches for a checkpoint. */
const SNAP = 14;

export function initPathChart(): void {
    const host = document.querySelector<HTMLElement>('.path-chart');
    if (!host) return;
    const lang = i18n.getLang();
    const now = Number(host.dataset.now);
    const points: Point[] = skillSeries(PROJECTS, now);
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
        const samples = pathSamples(points, t0, now, yDomain(points, t0));
        const span = PATH.W - PATH.L - PATH.R;
        const marks = points
            .filter((p) => p.m && p.t >= t0 - 1e-9)
            .map((p) => PATH.L + ((p.t - t0) / (now - t0)) * span);
        // The marks sit above the plot, so the crosshair listens on the whole svg and the plot's own bounds decide
        svg.addEventListener('pointermove', (e) => {
            const r = svg.getBoundingClientRect(),
                px = ((e.clientX - r.left) / r.width) * PATH.W;
            if (px < PATH.L || px > PATH.L + span) return hide();
            // Marks close together are fiddly to hit: the crosshair snaps to the nearest one within reach
            const closest = marks.reduce((best, x) => (Math.abs(x - px) < Math.abs(best - px) ? x : best), Infinity);
            const sx = Math.abs(closest - px) <= SNAP ? closest : px;
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
            tip.innerHTML = `<span class="mono">${monthName(time, lang)} · ${phaseLabel(lang, schoolYearAt(time), 0, true)}</span><strong>${i18n.t('home.path.skills').replace('{n}', String(valueAt(points, time)))}</strong><span>${what}</span>`;
            tip.hidden = false;
            tip.style.left = `${(sx / PATH.W) * 100}%`;
            tip.style.top = `${(py / PATH.H) * 100}%`;
        });
        svg.addEventListener('pointerleave', hide);
    };

    host.querySelectorAll<HTMLButtonElement>('.path-range button').forEach((b) =>
        b.addEventListener('click', () => {
            host.querySelectorAll('.path-range button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
            const range = RANGES.find((r) => r.id === b.dataset.range)!;
            t0 = rangeStart(range, points, now);
            // The headline follows the range: what changed since it began, like a price chart's 1M / 1Y / Max
            const delta = host.querySelector<HTMLElement>('.path-delta')!;
            const change = changeText(lang, range, points, t0);
            const over = document.createElement('span');
            over.className = 'sr-only';
            over.textContent = ` ${change.over}`;
            delta.replaceChildren(change.text, over);
            delta.classList.toggle('flat', !change.up);
            plot.querySelector('svg')!.outerHTML = pathSvg(lang, points, t0, now);
            host.classList.remove('drawn');
            void host.offsetWidth; // restart the draw-in
            host.classList.add('drawn');
            bind();
        })
    );
    bind();
}

/** True when `el` is inside something that matches `selector` (the parts that pause a timer while the pointer is on them). */
const within = (el: EventTarget | null, selector: string) => !!(el as Element | null)?.closest?.(selector);
const STORY_HOLD = '.path-plot, .path-range, .exp-card';
const DECK_HOLD = '.numbers-stage, .numbers-index, .numbers-nav';

const STEP_MS = 6500;

/**
 * Something that turns by itself (the path story, the numbers deck): `step` runs every STEP_MS while `host` is at
 * least `threshold` on screen and untouched. A mouse on a `hold` part, the keyboard inside `host`, a hidden tab and
 * reduced motion all pause it. `host` carries the class `playing` while it runs (the fill line is animated from it).
 * `arm(true)` starts a fresh step (call it when one begins); `arm()` only reacts to a change in what pauses it, so
 * calls that change nothing (alt-tab, focus moving inside, the pointer moving about) leave the timer running.
 */
function autoplay(o: {
    host: HTMLElement;
    /** Where the mouse is looked for: `hold` parts inside it pause the timer. */
    pointerRoot: HTMLElement;
    hold: string;
    /** Focus moving between things matching this is not leaving (a click on a button moves focus between buttons). */
    focusWithin: string;
    threshold: number;
    step: () => void;
}): (restart?: boolean) => void {
    const { host, pointerRoot, hold, focusWithin } = o;
    let timer = 0,
        visible = false,
        hover = false, // the pointer is on a part that pauses it
        focus = false; // the keyboard is on one
    const arm = (restart = false) => {
        const run = visible && !hover && !focus && !document.hidden && !reduced();
        if (run && !restart && host.classList.contains('playing')) return;
        clearTimeout(timer);
        host.classList.remove('playing');
        void host.offsetWidth; // restart the fill line together with the timer
        host.classList.toggle('playing', run);
        if (run) timer = window.setTimeout(o.step, STEP_MS);
    };
    pointerRoot.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse' || !within(e.target, hold)) return;
        hover = true;
        arm();
    });
    pointerRoot.addEventListener('pointerout', (e) => {
        if (e.pointerType !== 'mouse' || !within(e.target, hold) || within(e.relatedTarget, hold)) return;
        hover = false;
        arm();
    });
    host.addEventListener('focusin', (e) => {
        focus = (e.target as Element).matches(':focus-visible');
        arm();
    });
    host.addEventListener('focusout', (e) => {
        if (within(e.relatedTarget, focusWithin)) return;
        focus = false;
        arm();
    });
    document.addEventListener('visibilitychange', () => arm());
    new IntersectionObserver(([e]) => ((visible = e.isIntersecting), arm()), { threshold: o.threshold }).observe(host);
    return arm;
}

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
    let current = '';

    const ids = () => [...section.querySelectorAll<SVGElement>('.path-svg .mark')].map((m) => m.dataset.cp!);
    const arm = autoplay({
        host: card,
        pointerRoot: section,
        hold: STORY_HOLD,
        focusWithin: '.exp-card',
        threshold: 0.5,
        step: () => step(1)
    });
    function select(id: string, force = false) {
        const all = ids();
        card!.hidden = !all.length; // a range with no checkpoint (a quiet year) has nothing to tell
        const next = all.includes(id) ? id : all[0];
        if (next === current && !force) return;
        current = next;
        section!.querySelector('.marks')?.classList.add('lit');
        section!.querySelectorAll<HTMLElement | SVGElement>('[data-cp]').forEach((n) => {
            n.classList.toggle('on', n.dataset.cp === current);
        });
        count.textContent = `${all.indexOf(current) + 1} / ${all.length}`;
        arm(true);
    }
    function step(dir: number) {
        const all = ids();
        select(all[(all.indexOf(current) + dir + all.length) % all.length]);
    }

    section.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const mark = (e.target as Element).closest<SVGElement>('.mark[data-cp]');
        if (mark) select(mark.dataset.cp!);
    });
    section.addEventListener('click', (e) => {
        const mark = (e.target as Element).closest<SVGElement>('.mark[data-cp]');
        if (mark) select(mark.dataset.cp!);
    });
    nav.querySelector('.exp-prev')!.addEventListener('click', () => step(-1));
    nav.querySelector('.exp-next')!.addEventListener('click', () => step(1));
    new MutationObserver(() => select(current, true)).observe(section.querySelector('.path-plot')!, {
        childList: true
    });
    select(ids()[0], true);
}

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
            const name = document.createElement('span'),
                value = document.createElement('small');
            name.textContent = c.querySelector('.card-k')!.textContent;
            value.textContent = c.querySelector('.card-v')!.textContent;
            b.append(name, value);
            b.addEventListener('click', () => show(i, true));
            return b;
        })
    );
    const items = [...index.children] as HTMLButtonElement[];
    let cur = -1;
    const arm = autoplay({
        host: root,
        pointerRoot: root,
        hold: DECK_HOLD,
        focusWithin: '.numbers',
        threshold: 0.4,
        step: () => show(cur + 1)
    });
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
            // The first card counts up with the deck's own reveal (src/ui/reveal.ts), once it is on screen
            if (prev >= 0) front.querySelectorAll<HTMLElement>('.count').forEach(countUp);
        }
        items.forEach((b, i) =>
            i === cur ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')
        );
        arm(true);
    }
    nav.querySelector('.numbers-prev')!.addEventListener('click', () => show(cur - 1, true));
    nav.querySelector('.numbers-next')!.addEventListener('click', () => show(cur + 1, true));
    stage.addEventListener('click', (e) => {
        const card = (e.target as Element).closest<HTMLElement>('.chart-card');
        if (card && card !== cards[cur]) show(cards.indexOf(card), true);
    });
    show(0);
}
