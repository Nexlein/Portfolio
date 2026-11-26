// Keeps the docs true: relative links and #anchors resolve, files named in `code` exist, every `npm run <script>` is in
// package.json, and the indexes list every page. External links stay out: the pre-commit hook runs offline.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
const BASENAMES = new Set(FILES.map((file) => posix.basename(file)));
/** Tracked Markdown at the root and in docs/ (untracked notes stay out); the code map is generated. */
const DOCS = FILES.filter((file) => /^(?:[^/]+|docs\/.+)\.md$/.test(file));
/** They look like file names but are generated (sitemap.xml), untracked on purpose (TODO.md, the owner's notes, and
 * .env), gone (.nvmrc, in an ADR), an extension (.ts, .css) or a class (html.js). */
const NOT_FILES = new Set(['sitemap.xml', 'TODO.md', '.env', '.nvmrc', '.ts', '.css', 'html.js']);
/** A bare `name.ext` or `.dotfile` token in a `code` span names a tracked file somewhere in the repo. */
const FILE_NAME =
    /^(?:[\w-][\w.-]*\.(?:ts|js|mjs|json|jsonc|html|css|md|ya?ml|toml|sh|svg|png|jpe?g|webp|mp4|txt|xml)|\.[a-z][\w.-]*)$/;
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
const fileNamesIn = (prose: string): string[] =>
    tokensIn(prose).filter((token) => !token.includes('/') && FILE_NAME.test(token) && !NOT_FILES.has(token));

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
                .filter((name) => !BASENAMES.has(name))
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
