// Social preview of the home page, one per language (public/og-image.png and og-image-fr.png, 1200x630, what
// LinkedIn and X expect) and the icons (favicon.png 32x32, apple-touch-icon.png 180x180), drawn with the site's own
// tokens and fonts, so they follow the design. Text comes from the profile data and the dictionaries.
// Usage: npm run media:brand   (Node runs this TypeScript file as it is)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from '@playwright/test';
import { NOW } from '../src/data/profile.ts';
import { OWNER } from '../src/core/site.ts';
import { lookup, type Lang } from '../src/core/translate.ts';

const require = createRequire(import.meta.url);
const SANS = '@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal';
const font = (name: string, weight: number, file: string) =>
    `@font-face { font-family: '${name}'; font-weight: ${weight}; src: url('data:font/woff2;base64,${readFileSync(require.resolve(`${file}.woff2`)).toString('base64')}'); }`;

const og = (lang: Lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
${font('Schibsted Grotesk', 500, SANS)}
${font('Schibsted Grotesk', 700, SANS)}
${font('IBM Plex Mono', 400, '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal')}
:root { --bg: #0a0e14; --surface: #121821; --ink: #e6eaf0; --signal: #ff7a1a; --cold: #4c8dff; --third: #2dd4a0; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; background: var(--bg); color: var(--ink); font-family: 'Schibsted Grotesk', sans-serif; position: relative; }
.glow { position: absolute; inset: 0; background: radial-gradient(640px 420px at 88% 8%, rgb(255 122 26 / 0.22), transparent 70%), radial-gradient(520px 380px at 4% 100%, rgb(76 141 255 / 0.14), transparent 70%); }
.dots { position: absolute; inset: 0; background-image: radial-gradient(rgb(230 234 240 / 0.07) 1px, transparent 1.5px); background-size: 28px 28px; }
.frame { position: absolute; inset: 56px 72px; display: flex; flex-direction: column; justify-content: space-between; }
.mono { font-family: 'IBM Plex Mono', monospace; font-size: 24px; letter-spacing: 0.04em; color: color-mix(in oklab, var(--ink) 66%, var(--bg)); }
.mono b { color: var(--signal); font-weight: 400; }
.top { display: flex; justify-content: space-between; }
h1 { font-size: 104px; line-height: 0.98; font-weight: 700; letter-spacing: -0.03em; }
.role { margin-top: 28px; font-size: 40px; font-weight: 500; color: color-mix(in oklab, var(--ink) 80%, var(--bg)); }
.pill { white-space: nowrap; display: inline-flex; align-items: center; gap: 14px; padding: 14px 24px; border: 1px solid rgb(230 234 240 / 0.14); border-radius: 999px; background: var(--surface); font-size: 26px; }
.pill i { width: 12px; height: 12px; border-radius: 50%; background: var(--signal); box-shadow: 0 0 0 6px rgb(255 122 26 / 0.18); }
.bar { position: absolute; left: 0; top: 0; width: 8px; height: 630px; background: var(--signal); }
</style></head><body>
<div class="glow"></div><div class="dots"></div><div class="bar"></div>
<div class="frame">
  <div class="mono top"><span><b>●</b>&nbsp; nexlein.vercel.app</span><span>${OWNER.city} · ${OWNER.school}</span></div>
  <div><h1>Nielsen<br>COMBE--BRACCIALE</h1><p class="role">${lookup(lang, 'cv.hero.role')}</p></div>
  <div><span class="pill"><i></i>${NOW.availability[lang]}</span></div>
</div>
</body></html>`;

const icon = (size: number) => `<!doctype html><html><head><meta charset="utf-8"><style>
${font('Schibsted Grotesk', 700, SANS)}
* { margin: 0; }
body { width: ${size}px; height: ${size}px; background: #0a0e14; display: grid; place-items: center; position: relative; }
span { font: 700 ${size * 0.66}px/1 'Schibsted Grotesk', sans-serif; color: #e6eaf0; letter-spacing: -0.04em; }
i { position: absolute; right: ${size * 0.17}px; bottom: ${size * 0.19}px; width: ${size * 0.12}px; height: ${size * 0.12}px; border-radius: 50%; background: #ff7a1a; }
</style></head><body><span>N</span><i></i></body></html>`;

const SHOTS = [
    { html: og('en'), width: 1200, height: 630, path: 'public/og-image.png' },
    { html: og('fr'), width: 1200, height: 630, path: 'public/og-image-fr.png' },
    { html: icon(180), width: 180, height: 180, path: 'public/apple-touch-icon.png' },
    { html: icon(32), width: 32, height: 32, path: 'public/favicon.png' }
];

const browser = await chromium.launch();
try {
    for (const { html: content, width, height, path } of SHOTS) {
        const page = await browser.newPage({ viewport: { width, height } });
        await page.setContent(content);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path });
        console.log(`media: ${path}`);
    }
} finally {
    await browser.close();
}
