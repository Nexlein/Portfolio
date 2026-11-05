import { test, expect } from './fixtures';
import { fill } from '../src/core/lang';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';

test.describe('theme', () => {
    test('the menu switches theme and remembers it', async ({ page }) => {
        await page.goto('/');
        await page.locator('.nav-theme-btn').click();
        await page.locator('[data-theme-id="daylight"]').click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'daylight');
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'daylight');
    });

    test('a page the back button restores follows a theme picked since', async ({ page }) => {
        await page.goto('/');
        const theme = await page.evaluate(() =>
            document.documentElement.dataset.theme === 'daylight' ? 'midnight' : 'daylight'
        );
        await page.evaluate((t) => {
            localStorage.setItem('theme', t);
            window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
        }, theme);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    });

    test('follows a light system preference on a first visit', async ({ browser }) => {
        const context = await browser.newContext({ colorScheme: 'light' });
        const page = await context.newPage();
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'daylight');
        await context.close();
    });
});

test.describe('language', () => {
    test("scripts carry no dictionary: the page's own strings are embedded in it, in its language", async ({
        page
    }) => {
        const scripts: Promise<string>[] = [];
        page.on('response', (r) => r.request().resourceType() === 'script' && scripts.push(r.text()));
        await page.goto('/fr/');
        await page.locator('#work').scrollIntoViewIfNeeded(); // the map's code too, on wide screens
        await page.waitForLoadState('networkidle');
        expect(scripts.length).toBeGreaterThan(0);
        const code = (await Promise.all(scripts)).join('\n');
        expect(code).not.toContain(en.home.hero.title2b);
        expect(code).not.toContain(fr.home.hero.title2b);
        await page.locator('.copy-email').click();
        await expect(page.locator('.toast')).toHaveText(new RegExp(`${fr.home.contact.copied}|@`));
        await page.locator('.path-range [data-range="1y"]').click();
        await expect(page.locator('.path-range [data-range="1y"]')).toHaveText(fr.home.path.ranges['1y']);
        await expect(page.locator('.path-delta')).toContainText(fill(fr.home.path.over, { n: 12 }));
    });

    test('the switch opens the same page in the other language and remembers it', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await page.locator('.nav-lang a[data-lang="fr"]').click();
        await expect(page).toHaveURL(/\/fr\/$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page).toHaveTitle(fr.meta.home.title);
        await expect(page.locator('[data-i18n="home.hero.title1"]')).toHaveText(fr.home.hero.title1);
        expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('fr');
    });

    test('French browsers are sent to the French page on their first visit', async ({ browser }) => {
        const context = await browser.newContext({ locale: 'fr-FR' });
        const page = await context.newPage();
        await page.goto('/cv.html');
        await expect(page).toHaveURL(/\/fr\/cv\.html$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page.locator('body')).toBeVisible();
        await context.close();
    });

    test('a chosen language beats the browser language', async ({ browser }) => {
        const context = await browser.newContext({ locale: 'fr-FR' });
        await context.addInitScript(() => localStorage.setItem('lang', 'en'));
        const page = await context.newPage();
        await page.goto('/');
        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await context.close();
    });

    test('a shared French link stays French for English browsers', async ({ page }) => {
        await page.goto('/fr/cv.html');
        await expect(page).toHaveURL(/\/fr\/cv\.html$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page.locator('[data-i18n="cv.controls.print"]')).toHaveText(fr.cv.controls.print);
    });

    test('the CV link follows the language', async ({ page }) => {
        await page.goto('/fr/');
        await expect(page.locator('.nav-cv')).toHaveAttribute('href', '/fr/cv.html');
    });
});

test.describe('navbar', () => {
    test('stays at the top while scrolling, on every page', async ({ page }) => {
        for (const path of ['/', '/cv.html', '/projects/zappy.html']) {
            await page.goto(path);
            await page.evaluate(() => scrollTo(0, 1200));
            await expect
                .poll(() => page.locator('.nav').evaluate((el) => Math.round(el.getBoundingClientRect().top)))
                .toBe(0);
        }
    });

    test('the progress line follows the scroll', async ({ page }) => {
        await page.goto('/');
        const bar = page.locator('.nav-progress');
        const scale = () => bar.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
        expect(await scale()).toBe(0);
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        await expect.poll(scale).toBeGreaterThan(0.9);
    });

    test('the first Tab reaches a skip link that jumps to the content', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Tab');
        const skip = page.locator('.skip');
        await expect(skip).toBeFocused();
        await expect(skip).toBeInViewport();
        await expect(page.locator('main#main')).toHaveCount(1);
    });
});

test.describe('nav', () => {
    test('marks the section in view, and nothing again once the visitor is back at the hero', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        const current = page.locator('.nav-link[aria-current]');
        await expect(current).toHaveCount(0);
        await page.locator('#contact').scrollIntoViewIfNeeded();
        await expect(current).toHaveAttribute('data-section', 'contact');
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(current).toHaveCount(0);
    });

    test('the theme menu moves with the arrows, Home and End, and Escape returns to its button', async ({ page }) => {
        await page.goto('/');
        const button = page.locator('.nav-theme-btn');
        const items = page.locator('[data-theme-id]');
        await button.focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-theme-id][aria-checked="true"]')).toBeFocused(); // opens on the current theme
        await page.keyboard.press('End');
        await expect(items.last()).toBeFocused();
        await page.keyboard.press('ArrowDown'); // wraps round to the first
        await expect(items.first()).toBeFocused();
        await page.keyboard.press('ArrowUp'); // and back to the last
        await expect(items.last()).toBeFocused();
        await page.keyboard.press('Home');
        await expect(items.first()).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(button).toBeFocused();
        await expect(button).toHaveAttribute('aria-expanded', 'false');
    });
});
