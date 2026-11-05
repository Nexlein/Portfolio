import { test, expect } from './fixtures';
import { PROJECTS } from '../src/data/projects';
import { en } from '../src/i18n/en';

test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('every project and chart, and the contact links, are in the HTML', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.project-list li')).toHaveCount(PROJECTS.length);
        await expect(page.locator('.feature')).toHaveCount(PROJECTS.filter((p) => p.featured).length);
        await expect(page.locator('.path-svg')).toBeVisible();
        await expect(page.locator('.chart-card')).toHaveCount(7);
        await expect(page.locator('#contact .copy-email')).toHaveCount(1);
        await expect(page.locator('#method .method-item')).toHaveCount(3);
        await expect(page.locator('.hero-copy h1')).toBeVisible(); // reveals never hide content without JS
    });
});

test.describe('how I work', () => {
    test.beforeEach(({ isMobile }) => test.skip(isMobile, 'needs a mouse'));

    test('hovering an item lights it up and steps the others back', async ({ page }) => {
        await page.goto('/');
        const items = page.locator('.method-item');
        await items.nth(1).scrollIntoViewIfNeeded();
        await expect(items.nth(0)).toHaveCSS('opacity', '1');
        await items.nth(1).hover();
        await expect(items.nth(0)).toHaveCSS('opacity', '0.55');
        await expect(items.nth(2)).toHaveCSS('opacity', '0.55');
        await expect(items.nth(1)).toHaveCSS('opacity', '1');
        await expect(items.nth(1).locator('h3')).toHaveCSS('background-position', /^0(px|%) 0(px|%)$/);
        await expect(items.nth(1).locator('.method-n')).toHaveCSS('letter-spacing', /^\d+(\.\d+)?px$/);
        await page.mouse.move(2, 2);
        await expect(items.nth(0)).toHaveCSS('opacity', '1');
    });
});

test('copy email says what happened', async ({ page, context, browserName }) => {
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.locator('.copy-email').click();
    // Only Chromium can be granted the clipboard: elsewhere the toast shows the address instead
    await expect(page.locator('.toast')).toHaveText(browserName === 'chromium' ? en.home.contact.copied : /@/);
});

test('reduced motion: no scroll reveal hides content and nothing moves on its own', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.numbers-row').scrollIntoViewIfNeeded();
    await expect(page.locator('.chart-card').first()).toBeVisible();
    await expect(page.locator('.avail-dot')).toHaveCSS('animation-name', 'none');
});

test('reduced motion: cards and rows change state at once', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the map is for large screens');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.map-host').scrollIntoViewIfNeeded();
    await expect(page.locator('.nm.booted')).toHaveCount(1);
    await page.locator('.numbers-row').scrollIntoViewIfNeeded();
    const moving = await page
        .locator('.nm-card, .numbers.deck .chart-card, .feature')
        .evaluateAll((cards) => cards.filter((card) => getComputedStyle(card).transitionProperty !== 'none').length);
    expect(moving).toBe(0);
    const row = page.locator('.project-list li').first();
    await row.evaluate((li) => li.classList.add('row-in'));
    await expect(row).toHaveCSS('animation-name', 'none');
});

test.describe('scroll polish', () => {
    test('the hero button glides to its section and keeps the hash', async ({ page }) => {
        await page.goto('/');
        await page.locator('.hero .btn[href="#work"]').click();
        const top = () => page.locator('#work').evaluate((el) => Math.round(el.getBoundingClientRect().top));
        await expect.poll(top, { timeout: 5000 }).toBeLessThanOrEqual(60);
        expect(page.url()).toContain('#work');
        await expect(page.locator('#work')).toBeFocused();
    });

    test('a wheel turn during a glide hands the page back to the visitor', async ({ page }) => {
        await page.goto('/');
        // Timed inside the page (a test runner's round trips would make the moment of the wheel depend on the machine)
        const top = await page.evaluate(async () => {
            document.querySelector<HTMLElement>('.hero .btn[href="#work"]')!.click();
            await new Promise((resolve) => setTimeout(resolve, 120));
            window.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 })); // the glide stops here
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return Math.round(document.getElementById('work')!.getBoundingClientRect().top);
        });
        expect(top).toBeGreaterThan(200); // not at its end (about 50): the glide let go
    });

    test('the scroll cue shows at the top and fades once the page scrolls', async ({ page }) => {
        await page.goto('/');
        const cue = page.locator('.scroll-cue');
        await expect(cue).toHaveCSS('opacity', '1');
        await page.evaluate(() => scrollTo(0, 400));
        await expect.poll(() => cue.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    });

    test('with reduced motion the cue does not bob', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        await expect(page.locator('.scroll-cue')).toHaveCSS('animation-name', 'none');
    });

    test('old #numbers links land on the numbers', async ({ page }) => {
        await page.goto('/#numbers');
        await expect(page.locator('.numbers-row')).toBeInViewport();
    });

    // The browser scrolls before the script trims the project list: the target must still end up on screen
    for (const [id, section] of [
        ['path', 'path'],
        ['contact', 'contact'],
        ['hire', 'contact'] // links from before the section became Contact
    ])
        test(`a link to /#${id} lands on its section after the page has settled`, async ({ page }) => {
            await page.goto(`/#${id}`);
            await expect(page.locator(`#${section} h2`)).toBeInViewport();
        });
});
