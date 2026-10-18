/**
 * Reveals: blocks marked .reveal fade and slide in, their count-ups run and charts draw in, once each comes into
 * view. Without JS (no html.js) nothing is hidden. Kept apart from the charts so pages without charts (a project
 * page) load only this.
 */
import { prefersReducedMotion as reduced } from './motion';

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

/** Reveal animations, count-ups and the chart draw-in start once each block comes into view. */
export function initReveals(): void {
    const io = new IntersectionObserver(
        (entries) =>
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const n = e.target as HTMLElement;
                n.classList.add('in', 'drawn');
                n.querySelectorAll<HTMLElement>('.chart-card:not([inert]) .count, .path-total .count').forEach(countUp);
                io.unobserve(n);
            }),
        { rootMargin: '0px 0px -12% 0px' }
    );
    document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}
