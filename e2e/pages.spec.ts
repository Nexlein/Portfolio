import { test, expect } from './fixtures';

const pages = [
    { path: '/', heading: 'Nielsen' },
    { path: '/cv.html', heading: 'Nielsen' },
    { path: '/availability.html', heading: null }
];

for (const { path, heading } of pages) {
    test(`${path} loads with production headers, fonts and no errors`, async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");

        await expect(page).toHaveTitle(/\S/);
        await expect(page.locator('html')).toHaveClass(/i18n-ready/);
        if (heading) await expect(page.locator('h1').first()).toContainText(heading);

        const fontsLoaded = await page.evaluate(async () => {
            await document.fonts.ready;
            return document.fonts.check('16px Inter');
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
    for (const { path } of pages) await page.goto(path, { waitUntil: 'networkidle' });
    expect(external).toEqual([]);
});
