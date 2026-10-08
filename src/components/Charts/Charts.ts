/**
 * Interactions on the build-time charts: the path chart's range buttons and crosshair, the numbers' two faces,
 * and count-ups when they come into view. The SVG is already in the page; this only adds behaviour.
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

/** Bento cards: two faces each, switched by the dots; replay the face's count-ups when shown. */
export function initNumbers(): void {
    document.querySelectorAll<HTMLElement>('.chart-card').forEach((card) => {
        const faces = [...card.querySelectorAll<HTMLElement>('.face')],
            dots = [...card.querySelectorAll<HTMLButtonElement>('.dots button')];
        faces.forEach((f, i) => {
            f.hidden = false; // the faces now crossfade in place (CSS); without JS only the first one shows
            f.classList.toggle('show', i === 0);
        });
        dots.forEach((d, i) =>
            d.addEventListener('click', () => {
                faces.forEach((f, k) => f.classList.toggle('show', k === i));
                dots.forEach((o, k) => o.setAttribute('aria-pressed', String(k === i)));
                faces[i].querySelectorAll<HTMLElement>('.count').forEach(countUp);
            })
        );
    });
}

/** Reveal animations, count-ups and the chart draw-in start once each block comes into view. */
export function initReveals(): void {
    const io = new IntersectionObserver(
        (entries) =>
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const n = e.target as HTMLElement;
                n.classList.add('in', 'drawn');
                n.querySelectorAll<HTMLElement>('.face.show .count, .path-total .count').forEach(countUp);
                io.unobserve(n);
            }),
        { rootMargin: '0px 0px -12% 0px' }
    );
    document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}
