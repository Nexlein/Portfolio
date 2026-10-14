/** True when the visitor asked for less motion: nothing moves by itself, and pictures are drawn once. */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
