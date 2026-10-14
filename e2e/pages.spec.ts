import { test, expect } from './fixtures';

const pages = ['', '/fr'].flatMap((prefix) => [
    { path: `${prefix}/`, heading: prefix ? 'fiable' : 'reliable' },
    { path: `${prefix}/cv.html`, heading: 'Nielsen' },
    { path: `${prefix}/projects/zappy.html`, heading: 'Zappy' },
    { path: `${prefix}/404.html`, heading: prefix ? 'Rien' : 'Nothing' }
]);

for (const { path, heading } of pages) {
    test(`${path} loads with production headers, fonts and no errors`, async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");

        await expect(page).toHaveTitle(/\S/);
        await expect(page.locator('html')).toHaveAttribute('lang', path.startsWith('/fr/') ? 'fr' : 'en');
        if (heading) await expect(page.locator('h1').first()).toContainText(heading);

        const fontsLoaded = await page.evaluate(async () => {
            await document.fonts.ready;
            return document.fonts.check('16px "Schibsted Grotesk"');
        });
        expect(fontsLoaded).toBe(true);
        // The fixture fails the test on console errors or CSP violations
    });
}

// The preload is picked by file name from the build (vite-plugins/shared-head.ts): a font package that renames its files
// would drop it silently
for (const path of ['/', '/fr/', '/projects/zappy.html'])
    test(`${path} preloads the two fonts the first screen uses, and both exist`, async ({ page, request }) => {
        await page.goto(path);
        const hrefs = await page
            .locator('link[rel="preload"][as="font"]')
            .evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
        expect(hrefs).toHaveLength(2);
        for (const href of hrefs) expect((await request.get(href)).status()).toBe(200);
    });

test('no request leaves our own origin', async ({ page, baseURL }) => {
    const external: string[] = [];
    page.on('request', (req) => {
        if (!req.url().startsWith(baseURL!) && !req.url().startsWith('data:')) external.push(req.url());
    });
    for (const { path } of pages) await page.goto(path, { waitUntil: 'load' });
    expect(external).toEqual([]);
});

test('the CV links to the PDF in its own language, in a new tab', async ({ page }) => {
    for (const [path, pdf] of [
        ['/cv.html', '/cv.pdf'],
        ['/fr/cv.html', '/fr/cv.pdf']
    ]) {
        await page.goto(path);
        const link = page.locator('#cv-pdf-link');
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('target', '_blank');
        expect(new URL(await link.evaluate((a) => (a as HTMLAnchorElement).href)).pathname).toBe(pdf);
    }
});

test('the CV sheet wears the chosen theme on screen and prints as white paper', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'midnight'));
    await page.goto('/cv.html');
    const sheet = page.locator('.sheet');
    await expect(sheet).toHaveCSS('background-color', 'rgb(18, 24, 33)');
    await page.emulateMedia({ media: 'print' });
    await expect(sheet).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test.describe('404 page', () => {
    test.use({ locale: 'fr-FR' });

    test('stays where it is for a French browser (no redirect loop) and leads home', async ({ page }) => {
        await page.goto('/404.html');
        await expect(page).toHaveURL(/\/404\.html$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await page.locator('#nf-home').click();
        await expect(page).toHaveURL(/\/$/);
    });
});

// WCAG reflow: at 320px wide (a 1280px window at 400% zoom) nothing may make the page scroll sideways, touch hit areas
// included. 280px (a folded phone) holds too.
for (const width of [320, 280])
    test.describe(`at ${width}px wide on a touch screen`, () => {
        test.use({ viewport: { width, height: 640 }, hasTouch: true, isMobile: true });

        for (const { path } of pages)
            test(`${path} does not scroll sideways`, async ({ page }) => {
                await page.goto(path, { waitUntil: 'networkidle' });
                await page.evaluate(async () => {
                    await document.fonts.ready; // text widths settle once the web fonts are in
                    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
                });
                const { scroll, client } = await page.evaluate(() => ({
                    scroll: document.documentElement.scrollWidth,
                    client: document.documentElement.clientWidth // not innerWidth: a mobile browser widens that to fit the overflow
                }));
                expect(scroll).toBeLessThanOrEqual(client);
            });

        // A project name with no place to break (a long compound word) must wrap, not widen the page
        const long =
            'Supercalifragilisticexpialidocious-extremely-long-project-name-0123456789-abcdefghijklmnopqrstuvwxyz';
        for (const [path, selector] of [
            ['/projects/zappy.html', '#project-title'],
            ['/', '.project-list strong']
        ])
            test(`a very long project name breaks inside its box (${selector})`, async ({ page }) => {
                await page.goto(path); // not 'networkidle': a project's video keeps the network busy
                await page.evaluate(() => document.fonts.ready);
                await page
                    .locator(selector)
                    .first()
                    .evaluate((el, text) => (el.textContent = text), long);
                const [scroll, client] = await page.evaluate(() => [
                    document.documentElement.scrollWidth,
                    document.documentElement.clientWidth
                ]);
                expect(scroll).toBeLessThanOrEqual(client);
            });
    });
