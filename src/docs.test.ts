// Keeps the docs true: relative links and #anchors resolve, files named in `code` exist, every `npm run <script>` is in
// package.json, and the indexes list every page. External links stay out: the pre-commit hook runs offline.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');

const ADR_DIR = 'docs/adr';

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
/** Tracked files and their folders, exact case: what GitHub serves. A file must be staged before a doc can name it. */
const FILES = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const TRACKED = new Set([
    ...FILES,
    ...FILES.flatMap((file) =>
        file
            .split('/')
            .slice(0, -1)
            .map((_, i, dirs) => dirs.slice(0, i + 1).join('/'))
    )
]);
const isTracked = (path: string) => TRACKED.has(posix.normalize(path).replace(/\/$/, ''));
/** File and folder names anywhere in the repo: a bare name in a doc must be one of them. */
const NAMES = new Set([...TRACKED].map((path) => posix.basename(path)));
/** Tracked Markdown at the root and in docs/ (untracked notes stay out); a doc deleted but not yet staged is skipped. */
const DOCS = FILES.filter((file) => /^(?:[^/]+|docs\/.+)\.md$/.test(file) && existsSync(join(ROOT, file)));
/** They look like file names but are generated (sitemap.xml), untracked on purpose (TODO.md, the owner's notes),
 * gone (.nvmrc, in an ADR) or a class (html.js). */
const NOT_FILES = new Set(['sitemap.xml', 'TODO.md', '.nvmrc', 'html.js']);
const extOf = (name: string) => posix.extname(name).slice(1).toLowerCase();
const EXTS = new Set(FILES.map(extOf).filter(Boolean));
const STEMS = new Set(FILES.map((file) => posix.basename(file, posix.extname(file))));

/** Whether a bare token reads as a file name. `.dotname`: unless it is an extension alone (`.webp`) that no tracked
 * folder bears (`.husky`). `name.ext`: when its stem or its extension is close to a tracked one, which catches
 * `mise.tomll` or `package.jsn` and leaves `engines.node` or `team.role` alone. */
function looksLikeFile(token: string): boolean {
    if (token.includes('/') || NOT_FILES.has(token)) return false;
    if (token.startsWith('.'))
        return /^\.[a-z][\w.-]*$/.test(token) && (NAMES.has(token) || !/^\.[a-z0-9]{1,5}$/.test(token));
    const ext = extOf(token);
    if (!/^[\w-][\w.-]*$/.test(token) || token.includes('..') || !/^[a-z0-9]{1,5}$/.test(ext)) return false;
    return (
        STEMS.has(posix.basename(token, posix.extname(token))) ||
        [...EXTS].some((e) => ext.startsWith(e) || e.startsWith(ext))
    );
}
/** Top-level folders: a `code` span that starts with one of them is a repo path. */
const TOP = new Set(FILES.filter((file) => file.includes('/')).map((file) => file.split('/')[0]));
const SCRIPTS = new Set(Object.keys(JSON.parse(read('package.json')).scripts));

/** The doc's text outside fenced code blocks, and the fenced blocks' text. */
function split(text: string): { prose: string; fenced: string } {
    const prose: string[] = [];
    const fenced: string[] = [];
    let open = ''; // the fence that opened the current block, '' outside one
    for (const line of text.split('\n')) {
        const fence = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
        if (fence && !open) open = fence;
        else if (fence && fence[0] === open[0] && fence.length >= open.length && !line.trim().slice(fence.length))
            open = '';
        else (open ? fenced : prose).push(line);
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
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // a link reads as its text
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

/** Tokens of `code` spans, placeholders (<id>), globs and elisions left out. */
const tokensIn = (prose: string): string[] =>
    [...prose.matchAll(/`([^`\n]+)`/g)]
        .flatMap(([, span]) => span.split(/\s+/))
        .map((token) => token.replace(/[,;:)]+$/, ''))
        .filter((token) => token && !/[<>*$]|\.\.\./.test(token))
        .flatMap(expand);

/** Tokens that name a repo path: they start with a tracked top-level folder. */
const pathsIn = (prose: string): string[] =>
    tokensIn(prose)
        .filter((token) => token.includes('/') && TOP.has(token.split('/')[0]))
        .filter((token) => !UNTRACKED.some((dir) => token === dir || token.startsWith(`${dir}/`)));

/** Tokens that name a file without its folder: `vercel.json`, `headers.test.ts`, `.lintstagedrc`. */
const fileNamesIn = (prose: string): string[] => tokensIn(prose).filter(looksLikeFile);

/** Link targets that stay in the repo: [text](target), images included. */
const localLinks = (prose: string): string[] =>
    [...prose.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
        .map(([, target]) => target)
        .filter((target) => !/^[a-z]+:/i.test(target));

describe('docs', () => {
    it('finds the docs', () => {
        expect(DOCS).toContain('README.md');
        expect(DOCS.filter((doc) => doc.startsWith(`${ADR_DIR}/`)).length).toBeGreaterThan(5);
    });

    it('links only to files and #anchors that exist', () => {
        const broken: string[] = [];
        for (const doc of DOCS) {
            for (const target of localLinks(split(read(doc)).prose)) {
                const [path, anchor] = target.split('#');
                const file = path ? (path.startsWith('/') ? path.slice(1) : posix.join(posix.dirname(doc), path)) : doc;
                if (!isTracked(file)) broken.push(`${doc}: ${target}`);
                else if (anchor && file.endsWith('.md') && !anchors(read(file)).has(anchor))
                    broken.push(`${doc}: ${target} (no such heading)`);
            }
        }
        expect(broken).toEqual([]);
    });

    it('names only repo paths that exist', () => {
        const missing = DOCS.flatMap((doc) =>
            pathsIn(split(read(doc)).prose)
                .filter((path) => !isTracked(path))
                .map((path) => `${doc}: ${path}`)
        );
        expect(missing).toEqual([]);
    });

    it('names only file names that exist', () => {
        const missing = DOCS.flatMap((doc) =>
            fileNamesIn(split(read(doc)).prose)
                .filter((name) => !NAMES.has(name))
                .map((name) => `${doc}: ${name}`)
        );
        expect(missing).toEqual([]);
    });

    it('names only npm scripts that exist', () => {
        const unknown = DOCS.flatMap((doc) =>
            [...read(doc).matchAll(/\bnpm run ([\w:.-]+)/g)]
                .map(([, script]) => script.replace(/[.,]+$/, '')) // a sentence's last word
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
        const adrs = DOCS.map((doc) => posix.relative(ADR_DIR, doc)).filter((file) => /^\d{4}-[^/]+\.md$/.test(file));
        expect(adrs.length).toBeGreaterThan(0);
        for (const adr of adrs) expect(index, adr).toContain(`](${adr})`);
    });

    it('maps every test file in docs/checks.md', () => {
        const checks = read('docs/checks.md');
        const tests = FILES.filter((file) => /^src\/.+\.test\.ts$|^e2e\/.+\.spec\.ts$/.test(file));
        expect(tests.filter((file) => !checks.includes(`\`${file}\``))).toEqual([]);
    });
});
