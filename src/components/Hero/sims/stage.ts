/**
 * What every hero simulation needs: a sized canvas, the theme's colours, the cursor over the hero, clicks on the
 * hero's empty space, and a frame loop that pauses off-screen, stops when the canvas is swapped out, and draws a
 * single still frame for reduced motion.
 */
import { prefersReducedMotion } from '@/ui/motion';

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
    /** Run `frame` every animation frame while visible; once only with reduced motion. */
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
    const visibility = new IntersectionObserver(([e]) => (seen = e.isIntersecting));
    visibility.observe(canvas);
    signal.addEventListener('abort', () => visibility.disconnect());
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
            const tick = (t: number) => {
                if (!canvas.isConnected) return; // another simulation took its place
                if (seen) frame(t);
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        },
        reduced
    };
}
