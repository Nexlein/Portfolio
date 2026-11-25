// Keeps the docs true: relative links and #anchors resolve, repo paths named in `code` exist, every `npm run <script>`
// is in package.json, and the indexes list every page. External links stay out: the pre-commit hook runs offline.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');

const ADR_DIR = 'docs/adr';
/** Every doc in the repo. Root notes that are not tracked stay out: only these root files are read. */
const DOCS = [
    'README.md',
    'CLAUDE.md',
    'SECURITY.md',
    ...readdirSync(join(ROOT, 'docs'), { recursive: true, encoding: 'utf8' })
        .filter((file) => file.endsWith('.md'))
        .map((file) => join('docs', file).replaceAll('\\', '/'))
];

/** Built, installed or local-only paths: a doc may name them, they need not exist. */
const UNTRACKED = [
    'dist',
    'cv-pdf',
    'test-results',
    'playwright-report',
    'node_modules',
    'coverage',
    '.husky/_',
    '.claude/settings.local.json',
    '.claude/worktrees'
];
/** Top-level folders: a `code` span that starts with one of them is a repo path. */
const TOP = new Set(
    readdirSync(ROOT, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name !== '.git')
        .map((entry) => entry.name)
);
const SCRIPTS = new Set(Object.keys(JSON.parse(read('package.json')).scripts));

/** The doc's text outside fenced code blocks, and the fenced blocks' text. */
function split(text: string): { prose: string; fenced: string } {
    const prose: string[] = [];
    const fenced: string[] = [];
    let inFence = false;
    for (const line of text.split('\n')) {
        if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
        else (inFence ? fenced : prose).push(line);
    }
    return { prose: prose.join('\n'), fenced: fenced.join('\n') };
}

/** GitHub's heading anchor: lower case, punctuation dropped, spaces to hyphens, -1, -2... for repeats. */
function anchors(text: string): Set<string> {
    const seen = new Map<string, number>();
    const out = new Set<string>();
    for (const [, heading] of split(text).prose.matchAll(/^#{1,6}\s+(.+)$/gm)) {
        const base = heading
            .trim()
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s_-]/gu, '')
            .replace(/\s/g, '-');
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        out.add(count ? `${base}-${count}` : base);
    }
    return out;
}

/** `src/i18n/{en,fr}.ts` -> both files. */
const expand = (path: string): string[] => {
    const match = path.match(/\{([^}]+)\}/);
    if (!match) return [path];
    return match[1].split(',').flatMap((part) => expand(path.replace(match[0], part)));
};

/** Tokens in `code` spans that name a repo path (placeholders such as <id> and globs are skipped). */
function pathsIn(prose: string): string[] {
    const tokens = [...prose.matchAll(/`([^`\n]+)`/g)].flatMap(([, span]) => span.split(/\s+/));
    return tokens
        .map((token) => token.replace(/[,;:)]+$/, ''))
        .filter((token) => !/[<>*$]|\.\.\./.test(token) && TOP.has(token.split('/')[0]) && token.includes('/'))
        .filter((token) => !UNTRACKED.some((dir) => token === dir || token.startsWith(`${dir}/`)))
        .flatMap(expand);
}

/** Link targets that stay in the repo: [text](target), images included. */
const localLinks = (prose: string): string[] =>
    [...prose.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
        .map(([, target]) => target)
        .filter((target) => !/^[a-z]+:/i.test(target));

describe('docs', () => {
    it('finds the docs', () => {
        expect(DOCS.length).toBeGreaterThan(5);
        for (const doc of DOCS) expect(existsSync(join(ROOT, doc)), doc).toBe(true);
    });

    it('links only to files and #anchors that exist', () => {
        const broken: string[] = [];
        for (const doc of DOCS) {
            for (const target of localLinks(split(read(doc)).prose)) {
                const [path, anchor] = target.split('#');
                const file = path ? (path.startsWith('/') ? path.slice(1) : join(dirname(doc), path)) : doc;
                if (!existsSync(join(ROOT, file))) broken.push(`${doc}: ${target}`);
                else if (anchor && file.endsWith('.md') && !anchors(read(file)).has(anchor))
                    broken.push(`${doc}: ${target} (no such heading)`);
            }
        }
        expect(broken).toEqual([]);
    });

    it('names only repo paths that exist', () => {
        const missing = DOCS.flatMap((doc) =>
            pathsIn(split(read(doc)).prose)
                .filter((path) => !existsSync(join(ROOT, path)))
                .map((path) => `${doc}: ${path}`)
        );
        expect(missing).toEqual([]);
    });

    it('names only npm scripts that exist', () => {
        const unknown = DOCS.flatMap((doc) =>
            [...read(doc).matchAll(/\bnpm run ([\w:.-]+)/g)]
                .map(([, script]) => script)
                .filter((script) => !SCRIPTS.has(script))
                .map((script) => `${doc}: npm run ${script}`)
        );
        expect(unknown).toEqual([]);
    });

    it('lists every doc page in the README and every ADR in the ADR index', () => {
        const readme = read('README.md');
        const pages = DOCS.filter((doc) => doc.startsWith('docs/') && !doc.startsWith(`${ADR_DIR}/`));
        for (const page of pages) expect(readme, page).toContain(`](${page})`);
        const index = read(`${ADR_DIR}/README.md`);
        const adrs = readdirSync(join(ROOT, ADR_DIR)).filter((file) => /^\d{4}-.+\.md$/.test(file));
        expect(adrs.length).toBeGreaterThan(0);
        for (const adr of adrs) expect(index, adr).toContain(`](${adr})`);
    });

    it('maps every test file in docs/checks.md', () => {
        const checks = read('docs/checks.md');
        const tests = [
            ...readdirSync(join(ROOT, 'src'), { recursive: true, encoding: 'utf8' }).filter((file) =>
                file.endsWith('.test.ts')
            ),
            ...readdirSync(join(ROOT, 'e2e')).filter((file) => file.endsWith('.spec.ts'))
        ].map((file) => file.split(/[\\/]/).pop()!);
        expect(tests.filter((name) => !checks.includes(name))).toEqual([]);
    });
});
