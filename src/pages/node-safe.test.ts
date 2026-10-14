// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

/** Every file the build runs from Node: the Vite plugins and, through relative imports, everything they load. */
function reachable(entries: string[]): Map<string, string[]> {
    const specs = new Map<string, string[]>();
    const queue = [...entries];
    while (queue.length) {
        const file = queue.pop()!;
        if (specs.has(file)) continue;
        const source = readFileSync(file, 'utf8');
        const found = [...source.matchAll(/(?:import|export)[^'"`;]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
        specs.set(file, found);
        for (const spec of found)
            if (spec.startsWith('.') && spec.endsWith('.ts')) queue.push(resolve(dirname(file), spec));
    }
    return specs;
}

describe('modules the build runs from Node', () => {
    const files = reachable(['pages.ts', 'shared-head.ts'].map((f) => resolve(ROOT, 'vite-plugins', f)));

    it('reach a good part of the site (the walk found them)', () => {
        expect(files.size).toBeGreaterThan(15);
    });

    it.each([...files])('%s uses only relative imports with the .ts extension', (file, specs) => {
        const bad = specs.filter(
            (spec) =>
                !spec.startsWith('node:') &&
                !/^(vite|happy-dom)$/.test(spec) &&
                !(spec.startsWith('.') && spec.endsWith('.ts'))
        );
        expect(bad, relative(ROOT, file)).toEqual([]);
    });
});
