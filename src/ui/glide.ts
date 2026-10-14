/**
 * In-page links glide to their section instead of jumping (about 0.7 s, eased). With reduced motion they jump,
 * as the browser would. The address bar still gets the #hash, and the section takes focus for keyboard users.
 */
import { prefersReducedMotion } from './motion';

const DURATION = 700;

/** Ease in and out (cubic): gentle start, gentle landing. */
export function ease(t: number): number {
    return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

function glideTo(target: HTMLElement): void {
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const from = scrollY;
    const to = Math.max(0, target.getBoundingClientRect().top + scrollY - margin);
    const start = performance.now();
    // The visitor takes over: a wheel, a touch or a key ends the glide where it is (it would fight them otherwise)
    let cancelled = false;
    const cancel = () => (cancelled = true);
    for (const type of ['wheel', 'touchstart', 'keydown'])
        addEventListener(type, cancel, { once: true, passive: true });
    const step = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / DURATION);
        scrollTo(0, from + (to - from) * ease(t));
        if (t < 1) requestAnimationFrame(step);
        else {
            for (const type of ['wheel', 'touchstart', 'keydown']) removeEventListener(type, cancel);
            target.tabIndex = -1;
            target.focus({ preventScroll: true });
        }
    };
    requestAnimationFrame(step);
}

/** Make every in-page link inside `root` (the hero, the nav) glide. */
export function initGlide(root: ParentNode = document): void {
    root.addEventListener('click', (e) => {
        const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
        const id = link?.getAttribute('href')?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!link || !target || e.defaultPrevented || prefersReducedMotion()) return;
        e.preventDefault();
        history.replaceState(null, '', `#${id}`);
        glideTo(target);
    });
}
