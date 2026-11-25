// Prettier on every tracked file, untracked ones left alone. A Node script rather than `git ls-files | xargs` so
// `npm run format` also works where npm runs scripts in cmd.exe (Windows).
// Usage: node scripts/format.ts --write | --check
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const mode = process.argv[2];
if (mode !== '--write' && mode !== '--check') throw new Error('Usage: node scripts/format.ts --write | --check');

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const prettier = createRequire(import.meta.url).resolve('prettier/bin/prettier.cjs');

// Batches keep each command line under the Windows length limit
const BATCH = 100;
let failed = false;
for (let i = 0; i < files.length; i += BATCH) {
    const run = spawnSync(process.execPath, [prettier, '--ignore-unknown', mode, ...files.slice(i, i + BATCH)], {
        stdio: 'inherit'
    });
    if (run.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
