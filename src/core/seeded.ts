/** A small seeded random generator: pictures that look random but come out the same on every visit. */
export function seeded(seed: number): () => number {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}
