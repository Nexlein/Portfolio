import { test, expect } from './fixtures';

const pages = ['', '/fr'].flatMap((prefix) => [
    { path: `${prefix}/`, heading: prefix ? 'fiable' : 'reliable' },
    { path: `${prefix}/cv.html`, heading: 'Nielsen' },
    { path: `${prefix}/projects/zappy.html`, heading: 'Zappy' }
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
