/**
 * What every hero simulation needs: a sized canvas, the theme's colours, the cursor over the hero, clicks on the
 * hero's empty space, and a frame loop that pauses off-screen, stops when the canvas is swapped out, and draws a
 * single still frame for reduced motion.
 */
import { prefersReducedMotion } from '@/ui/motion';

/** Set by the hero's pause button: every frame loop holds still until it is cleared. */
let paused = false;
/** The wake of every live loop, so that resuming (or turning reduced motion off) restarts them. */
const wakers = new Set<() => void>();

/** Hold every simulation still, or set them going again. */
export function pauseSims(on: boolean): void {
    paused = on;
    if (!on) wakers.forEach((wake) => wake());
}

export interface Point {
    x: number;
    y: number;
}

export interface Stage {
    ctx: CanvasRenderingContext2D;
    colors: { line: string; cold: string; signal: string };
    readonly width: number;
    readonly height: number;
    /** Cursor position over the hero, or null. */
    pointer: () => Point | null;
    /** A slow wandering point, for when nobody points. */
    wander: (t: number) => Point;
    /** Click on the hero's empty space (not on its links or buttons). */
    onClick: (fn: (p: Point) => void) => void;
    onResize: (fn: () => void) => void;
    /** Remove every listener and observer this stage added (the canvas is being swapped out). */
    dispose: () => void;
    /** Run `frame` every animation frame while on screen and the tab is shown; once only with reduced motion. */
    loop: (frame: (t: number) => void) => void;
    reduced: boolean;
}

export function stage(canvas: HTMLCanvasElement): Stage {
    const ctx = canvas.getContext('2d')!;
    const host = canvas.parentElement!;
    const colors = { line: '', cold: '', signal: '' };
    const read = () => {
        const s = getComputedStyle(host);
        colors.line = s.getPropertyValue('--line').trim();
        colors.cold = s.getPropertyValue('--cold').trim();
        colors.signal = s.getPropertyValue('--signal').trim();
    };
    const resizers: (() => void)[] = [];
    // With reduced motion nothing animates: the single frame is drawn again whenever the canvas is cleared or recoloured
    let redraw: (() => void) | undefined;
    const size = () => {
        const dpr = Math.min(1.5, devicePixelRatio || 1); // abstract art: no need for full Retina pixels
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        resizers.forEach((fn) => fn());
        redraw?.();
    };
    let pointer: Point | null = null;
    const local = (e: PointerEvent | MouseEvent): Point => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    // Listeners live as long as this canvas: dispose() removes them when it is swapped out
    const life = new AbortController();
    const { signal } = life;
    host.addEventListener('pointermove', (e) => (pointer = local(e)), { signal });
    host.addEventListener('pointerleave', () => (pointer = null), { signal });
    window.addEventListener(
        'themechange',
        () => {
            read();
            redraw?.();
        },
        { signal }
    );
    // Resizing a canvas clears and reallocates it: once the window stops moving, not on every event
    let resizeTimer = 0;
    window.addEventListener(
        'resize',
        () => {
            clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(size, 120);
        },
        { signal }
    );
    signal.addEventListener('abort', () => clearTimeout(resizeTimer));
    let seen = true;
    let wake: (() => void) | undefined; // restarts the frame loop once it has stopped (set by `loop`)
    const visibility = new IntersectionObserver(([e]) => {
        seen = e.isIntersecting;
        wake?.();
    });
    visibility.observe(canvas);
    signal.addEventListener('abort', () => visibility.disconnect());
    document.addEventListener('visibilitychange', () => wake?.(), { signal });
    // The setting can change mid-visit: loops hold still while it is on and start again when it is turned off
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => wake?.(), { signal });
    read();
    size();
    const reduced = prefersReducedMotion();

    return {
        ctx,
        colors,
        get width() {
            return canvas.clientWidth;
        },
        get height() {
            return canvas.clientHeight;
        },
        pointer: () => pointer,
        wander: (t) => ({
            x: canvas.clientWidth * (0.55 + 0.3 * Math.sin(t)),
            y: canvas.clientHeight * (0.42 + 0.25 * Math.sin(t * 1.7))
        }),
        onClick: (fn) =>
            host.addEventListener(
                'click',
                (e) => {
                    if ((e.target as Element).closest('a, button')) return;
                    fn(local(e));
                },
                { signal }
            ),
        onResize: (fn) => resizers.push(fn),
        dispose: () => life.abort(),
        loop: (frame) => {
            if (reduced) {
                redraw = () => frame(performance.now());
                return redraw();
            }
            let running = false; // a frame is queued
            const tick = (t: number) => {
                // Scrolled away, tab hidden, paused, reduced motion turned on or replaced by another simulation:
                // stop asking for frames until `wake`
                if (!canvas.isConnected || !seen || document.hidden || paused || prefersReducedMotion())
                    return void (running = false);
                frame(t);
                requestAnimationFrame(tick);
            };
            const restart = () => {
                if (running) return;
                running = true;
                requestAnimationFrame(tick);
            };
            wake = restart;
            wakers.add(restart);
            signal.addEventListener('abort', () => wakers.delete(restart));
            wake();
        },
        reduced
    };
}
