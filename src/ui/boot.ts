/**
 * Start a page's scripts in turn. One that throws is reported and the next ones still run: a single broken piece
 * (a missing element, an API an old browser lacks) must not leave the rest of the page without its behaviour, nor
 * its content hidden (reveals keep .reveal blocks invisible until initReveals runs).
 */
export function boot(...inits: (() => void)[]): void {
    for (const init of inits) {
        try {
            init();
        } catch (error) {
            console.error(error);
        }
    }
}
