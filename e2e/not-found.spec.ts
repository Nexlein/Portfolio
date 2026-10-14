import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test'; // not ./fixtures: a 404 answer is logged by the browser as a console error

// Vercel answers every unknown URL with the English /404.html, status 404, at the address that was asked for.
// `vite preview` cannot do that, so the built file is served the same way here.
const notFound = readFileSync('dist/404.html');

test.describe('an unknown address', () => {
    const errors: string[] = [];
    test.beforeEach(async ({ page }) => {
        errors.length = 0;
        page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
        page.on('pageerror', (err) => errors.push(err.message));
        await page.route(/\/(fr\/)?definitely-missing$/, (route) =>
            route.fulfill({ status: 404, contentType: 'text/html; charset=utf-8', body: notFound })
        );
    });
    // The browser's own note that the address answered 404 is the only message allowed
    test.afterEach(() => expect(errors.filter((e) => !/status of 404/.test(e))).toEqual([]));

    test('shows the English 404 where it was asked for', async ({ page }) => {
        await page.goto('/definitely-missing');
        await expect(page).toHaveURL(/\/definitely-missing$/);
        await expect(page.locator('h1')).toContainText('Nothing here');
    });

    test('under /fr/ moves to the French 404 page', async ({ page }) => {
        await page.goto('/fr/definitely-missing');
        await expect(page).toHaveURL(/\/fr\/404\.html$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page.locator('h1')).toContainText('Rien ici');
        await page.locator('#nf-home').click();
        await expect(page).toHaveURL(/\/fr\/$/);
    });
});
