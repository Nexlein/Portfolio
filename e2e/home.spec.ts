import { test, expect } from './fixtures';
import { PROJECTS } from '../src/data/projects';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';

test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('every project, chart and offer is in the HTML', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.project-list li')).toHaveCount(PROJECTS.length);
        await expect(page.locator('.feature')).toHaveCount(PROJECTS.filter((p) => p.featured).length);
        await expect(page.locator('.path-svg')).toBeVisible();
        await expect(page.locator('.chart-card')).toHaveCount(7);
        await expect(page.locator('#hire .tile')).toHaveCount(2);
        await expect(page.locator('#method .method-item')).toHaveCount(3);
        await expect(page.locator('.hero-copy h1')).toBeVisible(); // reveals never hide content without JS
    });
});

test.describe('project map', () => {
    test.beforeEach(({ isMobile }) => test.skip(isMobile, 'phones get the list'));

    test('a domain chip filters the map, and the same chip clears it', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await expect(page.locator('.nm.booted')).toHaveCount(1);
        const chip = page.locator('.query button').first();
        const domain = await chip.getAttribute('data-domain');
        await chip.click();
        await expect(chip).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.nm')).toHaveClass(/filtered/);
        const dimmed = page.locator('.nm-card.dim');
        expect(await dimmed.count()).toBeGreaterThan(0);
        await expect(page.locator(`.nm-card.dim[data-domain="${domain}"]`)).toHaveCount(0);
        await chip.click();
        await expect(chip).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('.nm-card.dim')).toHaveCount(0);
    });

    test('a card the pointer only grazed does not stay frozen', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await page.waitForTimeout(4500);
        // Graze card A and move on to card B inside the hover-intent delay
        await page.evaluate(() => {
            const [a, b] = [...document.querySelectorAll('.nm-card:not(.off)')];
            const mouse = { pointerType: 'mouse' };
            a.dispatchEvent(new PointerEvent('pointerenter', mouse));
            a.dispatchEvent(new PointerEvent('pointerleave', mouse));
            b.dispatchEvent(new PointerEvent('pointerenter', mouse));
        });
        await page.waitForTimeout(500);
        const where = () =>
            page.evaluate(() => (document.querySelector('.nm-card:not(.off)') as HTMLElement).style.translate);
        const before = await where();
        await expect.poll(where, { timeout: 4000 }).not.toBe(before); // it keeps drifting with the others
    });

    test('resizing while a card is open leaves no stuck badge or open card', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await page.waitForTimeout(4500);
        await page.evaluate(() => {
            const card = document.querySelector('.nm-card:not(.off)')!;
            card.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
        });
        await expect(page.locator('.nm-card.near[data-score]').first()).toBeAttached();
        await page.setViewportSize({ width: 1290, height: 800 });
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await expect(page.locator('.nm-card[data-score]')).toHaveCount(0);
        await expect(page.locator('.nm-card.open')).toHaveCount(0);
    });

    test('draws every project and unfolds one on hover, with its similar projects', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        const cards = page.locator('.nm-card:not(.off)');
        await expect(cards).toHaveCount(PROJECTS.length);
        await expect(page.locator('.project-list')).toBeHidden(); // behind "See all" when the map is drawn

        await expect(page.locator('.nm.booted')).toHaveCount(1); // the map has drawn itself in
        const first = cards.first();
        // Cards float, so they are never 'stable', and one can drift from under the pointer during the hover-intent
        // delay: hover again until it opens, as a person would
        await expect(async () => {
            await first.hover({ force: true });
            await expect(first).toHaveClass(/open/, { timeout: 1000 });
        }).toPass({ timeout: 10_000 });
        await expect(page.locator('.nm-card.near').first()).toHaveAttribute('data-score', /\d/);
        // The score badge is the card's ::after: it must stay a small pill, not inherit the active-card glow ring
        const badge = await page
            .locator('.nm-card.near')
            .first()
            .evaluate((el) => {
                const style = getComputedStyle(el, '::after');
                return { shadow: style.boxShadow, border: style.borderTopWidth, content: style.content };
            });
        expect(badge.shadow).toBe('none');
        expect(badge.border).toBe('0px');
        expect(badge.content).toMatch(/\d/);
    });

    test('a click unfolds, a second click opens the project page', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded(); // the map is drawn as the section comes into view
        const card = page.locator('.nm-card[data-id="starttrek"]');
        await card.scrollIntoViewIfNeeded();
        await card.focus();
        await expect(card).toHaveClass(/open/);
        await card.press('Enter');
        await expect(page).toHaveURL(/\/projects\/starttrek\.html$/);
    });

    test('asking for a domain lights its projects up', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await page.locator('.query button[data-domain="ai"]').click();
        const aiCard = page.locator(`.nm-card[data-id="${PROJECTS.find((p) => p.category === 'ai')!.id}"]`);
        await expect
            .poll(async () =>
                Number(await aiCard.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--act')))
            )
            .toBeGreaterThan(0.2);
    });
});

test.describe('on phones', () => {
    test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'phones only'));

    test('the list replaces the map and links to every project page', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.nm-card')).toHaveCount(0);
        const link = page.locator('.project-list a').first();
        await link.scrollIntoViewIfNeeded();
        await link.click();
        await expect(page).toHaveURL(/\/projects\/.+\.html$/);
    });
});

test.describe('hero', () => {
    test('switches to another simulation', async ({ page }) => {
        await page.goto('/');
        const canvas = page.locator('canvas.hero-field');
        const before = await canvas.getAttribute('data-sim');
        await page.locator('.hero-dot[aria-pressed="false"]').first().click();
        await expect(canvas).not.toHaveAttribute('data-sim', before!);
        await expect(canvas).toHaveCount(1);
        await expect(page.locator('.hero-dot')).toHaveCount(4);
        await expect(page.locator('.hero-dot[aria-pressed="true"]')).toHaveCount(1);
    });

    test('old project links (/?project=id) open the project page', async ({ page }) => {
        await page.goto('/?project=arcade');
        await expect(page).toHaveURL(/\/projects\/arcade\.html$/);
    });
});

test.describe('charts', () => {
    test('the path chart changes range and explains a point on hover', async ({ page, isMobile }) => {
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        await chart.locator('.path-range button[data-range="1"]').click();
        await expect(chart.locator('.path-range button[data-range="1"]')).toHaveAttribute('aria-pressed', 'true');
        if (!isMobile) {
            await expect(chart).toHaveClass(/\bin\b/); // revealed: no longer moving
            const hit = chart.locator('.hit');
            const box = (await hit.boundingBox())!;
            await hit.hover({ position: { x: box.width * 0.6, y: box.height / 2 }, force: true });
            await expect(chart.locator('.path-tip')).toBeVisible();
        }
    });

    test('milestones are numbered on the curve and listed in order underneath', async ({ page }) => {
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        const items = chart.locator('.path-milestones li');
        const count = await items.count();
        expect(count).toBeGreaterThanOrEqual(5);
        await expect(chart.locator('.mark')).toHaveCount(count);
        await expect(items.first().locator('.n')).toHaveText('1');
        // Hovering an entry lights its marker
        await items.nth(2).hover();
        await expect(chart.locator('.mark[data-m="3"]')).toHaveClass(/on/);
        // A shorter range keeps the list whole and drops the markers that fall outside it
        await chart.locator('.path-range button[data-range="1"]').click();
        await expect(items).toHaveCount(count);
        expect(await chart.locator('.mark').count()).toBeLessThan(count);
    });

    test('the numbers are a gallery of charts that the arrows scroll', async ({ page }) => {
        await page.goto('/');
        const row = page.locator('.numbers-row');
        await row.scrollIntoViewIfNeeded();
        expect(await page.locator('.chart-card').count()).toBeGreaterThanOrEqual(7);
        const prev = page.locator('.numbers-prev');
        const next = page.locator('.numbers-next');
        await expect(prev).toBeDisabled();
        await next.click();
        await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
        await expect(prev).toBeEnabled();
        await prev.click();
        await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeLessThan(5);
    });

    test('old #numbers links land on the numbers', async ({ page }) => {
        await page.goto('/#numbers');
        await expect(page.locator('.numbers-row')).toBeInViewport();
    });
});

test('copy email says what happened', async ({ page, context, browserName }) => {
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.locator('.copy-email').click();
    await expect(page.locator('.toast')).toHaveText(new RegExp(`${en.home.hire.copied}|@`));
});

test.describe('theme', () => {
    test('the menu switches theme and remembers it', async ({ page }) => {
        await page.goto('/');
        await page.locator('.nav-theme-btn').click();
        await page.locator('[data-theme-id="daylight"]').click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'daylight');
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'daylight');
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

test('reduced motion: no scroll reveal hides content and nothing moves on its own', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.numbers-row').scrollIntoViewIfNeeded();
    await expect(page.locator('.chart-card').first()).toBeVisible();
    await expect(page.locator('.avail-dot')).toHaveCSS('animation-name', 'none');
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

test.describe('scroll polish', () => {
    test('the hero button glides to its section and keeps the hash', async ({ page }) => {
        await page.goto('/');
        await page.locator('.hero .btn[href="#work"]').click();
        const top = () => page.locator('#work').evaluate((el) => Math.round(el.getBoundingClientRect().top));
        await expect.poll(top, { timeout: 5000 }).toBeLessThanOrEqual(60);
        expect(page.url()).toContain('#work');
        await expect(page.locator('#work')).toBeFocused();
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
});

test.describe('hero title', () => {
    test('keeps changing while the pointer rests on the text or a button has focus', async ({ page }) => {
        await page.goto('/');
        const line = page.locator('.hero h1 .line').nth(1);
        const first = await line.textContent();
        await page.locator('.hero-copy .link').focus();
        await page.locator('.hero-copy').hover();
        await expect.poll(() => line.textContent(), { timeout: 12_000 }).not.toBe(first);
    });
});
