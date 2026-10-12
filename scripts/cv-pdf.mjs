// Render the CV page to PDF in every language, from the production build (run `vite build` first).
// Usage: npm run cv:pdf   -> cv-pdf/Nielsen-Combe-Bracciale-CV-{EN,FR}.pdf
// CI publishes these files to the rolling `cv` GitHub release; /cv.pdf and /fr/cv.pdf redirect there (vercel.json).
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

export const PDFS = [
    { path: '/cv.html', file: 'Nielsen-Combe-Bracciale-CV-EN.pdf' },
    { path: '/fr/cv.html', file: 'Nielsen-Combe-Bracciale-CV-FR.pdf' }
];
const OUT_DIR = 'cv-pdf';

const server = await preview({ preview: { port: 4174, strictPort: true }, logLevel: 'warn' });
const browser = await chromium.launch();
let failed = false;

try {
    await mkdir(OUT_DIR, { recursive: true });
    const page = await browser.newPage();
    for (const { path, file } of PDFS) {
        await page.goto(`http://localhost:4174${path}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        // The printed sheet clips at A4 height: content past it would vanish from the PDF without adding a page
        await page.emulateMedia({ media: 'print' });
        const overflow = await page.evaluate(() => {
            const sheet = document.querySelector('.sheet');
            return sheet ? sheet.scrollHeight - sheet.clientHeight : 0;
        });
        await page.emulateMedia({ media: null });
        if (overflow > 0) {
            console.error(
                `${file}: the CV overflows A4 by ${overflow}px, tighten the print styles in src/pages/cv/cv.css`
            );
            failed = true;
        }
        // The CV's print stylesheet lays it out on one A4 page and hides the on-screen controls
        const pdf = await page.pdf({
            path: `${OUT_DIR}/${file}`,
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true
        });
        const pages = pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0;
        console.log(`${file}: ${pages} page(s), ${(pdf.length / 1024).toFixed(0)} KB`);
        if (pages !== 1) {
            console.error(
                `  expected exactly 1 page: the CV no longer fits on A4, adjust the print styles in src/pages/cv/cv.css`
            );
            failed = true;
        }
    }
} finally {
    await browser.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
}

if (failed) process.exit(1);
