import type { Page } from '@playwright/test';
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
        await expect(page.locator('.project-list')).toBeHidden(); // the list is the other view

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

const rows = (page: Page) => page.locator('.project-list li:not([hidden])');

test.describe('project list', () => {
    test('shows a few rows, "Show more" adds a page at a time and "Show less" folds back', async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 900 }); // the list view, on every project
        await page.goto('/');
        await page.locator('.project-list').scrollIntoViewIfNeeded();
        await expect(rows(page)).toHaveCount(6);
        const more = page.locator('.more-btn');
        await expect(more).toHaveText(/Show 6 more/);
        await more.click();
        await expect(rows(page)).toHaveCount(12);
        await more.click();
        await expect(rows(page)).toHaveCount(PROJECTS.length);
        await expect(more).toHaveText('Show less');
        await more.click();
        await expect(rows(page)).toHaveCount(6);
    });

    test('desktop: a switch swaps the map and the list, and remembers the choice', async ({ page, isMobile }) => {
        test.skip(isMobile, 'phones have no map');
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await expect(page.locator('.nm')).toBeVisible();
        await expect(page.locator('.project-list')).toBeHidden();
        await page.locator('.work-view [data-view="list"]').click();
        await expect(page.locator('.nm')).toBeHidden();
        await expect(rows(page)).toHaveCount(6);
        await page.reload();
        await page.locator('#work').scrollIntoViewIfNeeded();
        await expect(page.locator('.work-view [data-view="list"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(rows(page)).toHaveCount(6);
        await page.locator('.work-view [data-view="map"]').click();
        await expect(page.locator('.nm')).toBeVisible();
        await expect(page.locator('.project-list')).toBeHidden();
    });

    test('desktop: a domain chip filters the list, and the page count follows', async ({ page, isMobile }) => {
        test.skip(isMobile, 'the chips are desktop only');
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await page.locator('.work-view [data-view="list"]').click();
        const domain = PROJECTS.find((p) => p.category === 'systems')!.category;
        const expected = PROJECTS.filter((p) => p.category === domain).length;
        await page.locator(`.query button[data-domain="${domain}"]`).click();
        await expect(rows(page)).toHaveCount(Math.min(6, expected));
        for (const li of await rows(page).all()) await expect(li.locator('a')).toHaveAttribute('data-domain', domain);
        await page.locator(`.query button[data-domain="${domain}"]`).click();
        await expect(rows(page)).toHaveCount(6);
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

    test('the numbers are a deck: one chart in front, the arrows and the index bring another one forward', async ({
        page
    }) => {
        await page.goto('/');
        const stage = page.locator('.numbers-row');
        await stage.scrollIntoViewIfNeeded();
        expect(await page.locator('.chart-card').count()).toBeGreaterThanOrEqual(7);
        const front = page.locator('.chart-card[data-pos="0"]');
        await expect(front).toHaveCount(1);
        const first = await front.locator('.card-k').textContent();
        await page.locator('.numbers-next').click();
        await expect(front.locator('.card-k')).not.toHaveText(first!);
        await page.locator('.numbers-prev').click();
        await expect(front.locator('.card-k')).toHaveText(first!);
        const third = page.locator('.numbers-index button').nth(3);
        if (await third.isVisible()) {
            await third.click(); // the index is desktop only
            await expect(third).toHaveAttribute('aria-current', '');
        }
        await expect(page.locator('.chart-card[data-pos="0"]')).toHaveCount(1);
        expect(await stage.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    });

    test('the deck turns by itself, and stops while the pointer is on it', async ({ page }) => {
        await page.goto('/');
        await page.locator('.numbers-row').scrollIntoViewIfNeeded();
        const front = page.locator('.chart-card[data-pos="0"] .card-k');
        const first = await front.textContent();
        await page.mouse.move(2, 2);
        await expect(front).not.toHaveText(first!, { timeout: 12000 });
    });

    test('the story under the path chart: one checkpoint at a time, lit on the chart, driven by arrows and hover', async ({
        page
    }) => {
        await page.goto('/');
        const marks = page.locator('.path-svg .mark');
        await page.locator('.exp-card').scrollIntoViewIfNeeded();
        expect(await page.locator('.exp').count()).toBe(await marks.count());
        await expect(page.locator('.exp.on')).toHaveCount(1);
        await expect(page.locator('.path-svg .mark.on')).toHaveCount(1);
        const first = await page.locator('.exp.on').getAttribute('data-cp');
        await page.locator('.exp-next').click();
        await expect(page.locator('.exp.on')).not.toHaveAttribute('data-cp', first!);
        await expect(page.locator('.path-svg .mark.on')).not.toHaveAttribute('data-cp', first!);
        await page.locator('.exp-prev').click();
        await expect(page.locator('.exp.on')).toHaveAttribute('data-cp', first!);
        // Climb2C sits mid-chart, clear of its neighbours on a phone-width plot
        await page.locator('.path-svg .mark[data-cp="climb2c"] .mark-hit').hover({ force: true });
        await expect(page.locator('.exp.on')).toHaveAttribute('data-cp', 'climb2c');
        await expect(page.locator('.path-svg .mark.on')).toHaveAttribute('data-cp', 'climb2c');
    });

    test('the story turns by itself, and a range change keeps a valid selection', async ({ page }) => {
        await page.goto('/');
        await page.locator('.exp-card').scrollIntoViewIfNeeded();
        await page.mouse.move(2, 2);
        const first = await page.locator('.exp.on').getAttribute('data-cp');
        await expect(page.locator('.exp.on')).not.toHaveAttribute('data-cp', first!, { timeout: 12000 });
        await page.locator('.path-range [data-range="1"]').click();
        await expect(page.locator('.exp.on')).toHaveCount(1);
        await expect(page.locator('.path-svg .mark.on')).toHaveCount(1);
        await expect(page.locator('.exp-count')).toHaveText(/^1 \/ \d$/);
    });

    test('moving the pointer about or changing focus does not restart the story timer', async ({ page, isMobile }) => {
        test.skip(isMobile, 'needs a mouse');
        await page.setViewportSize({ width: 1280, height: 2400 }); // the story and the numbers on screen together
        await page.goto('/');
        await page.locator('#numbers').scrollIntoViewIfNeeded();
        await page.mouse.move(2, 2);
        const elapsed = () =>
            page.locator('.exp-progress').evaluate((el) => Number(el.getAnimations()[0]?.currentTime ?? 0));
        await expect.poll(elapsed).toBeGreaterThan(900);
        // The pointer crosses the numbers part (index, arrows, section text)
        await page.locator('.numbers-sub').hover();
        await page.locator('.numbers-index button').nth(2).hover();
        await page.locator('.numbers-nav button').first().hover();
        await page.mouse.move(2, 2, { steps: 3 });
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        expect(await elapsed()).toBeGreaterThan(1200);
    });

    test('the timers pause only on the chart plot, the range buttons and the panel, not on the rest of the block', async ({
        page,
        isMobile
    }) => {
        test.skip(isMobile, 'needs a mouse');
        await page.setViewportSize({ width: 1280, height: 2400 });
        await page.goto('/');
        await expect(page.locator('.work')).toHaveAttribute('data-view', 'map'); // the layout above has settled
        // The chart, the story and the deck all fit on screen from here. The hovers are forced: the chart is still
        // sliding in (a reveal), and waiting for it to be "stable" made Playwright scroll the story out of view
        await page.locator('.path-chart').evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 120)); // clear of the sticky nav
        await page.mouse.move(2, 2);
        const story = page.locator('.exp-card');
        await expect(story).toHaveClass(/playing/);
        await page.locator('.path-symbol').hover({ force: true }); // the ticker above the plot
        await expect(story).toHaveClass(/playing/);
        await page.locator('.path-svg .hit').hover({ position: { x: 300, y: 150 }, force: true });
        await expect(story).not.toHaveClass(/playing/);
        await page.locator('.path-range button').first().hover({ force: true });
        await expect(story).not.toHaveClass(/playing/);
        await page.locator('.numbers-sub').hover({ force: true }); // the line of text above the deck
        await expect(story).toHaveClass(/playing/);
        const deck = page.locator('.numbers');
        await expect(deck).toHaveClass(/playing/);
        await page.locator('.numbers-index button').nth(2).hover({ force: true });
        await expect(deck).not.toHaveClass(/playing/);
        await page.locator('.numbers-sub').hover({ force: true });
        await expect(deck).toHaveClass(/playing/);
    });

    test('clicking index entries keeps the deck paused while the pointer stays, and it resumes once it leaves', async ({
        page,
        isMobile
    }) => {
        test.skip(isMobile, 'needs a mouse');
        await page.setViewportSize({ width: 1280, height: 2400 });
        await page.goto('/');
        await page.locator('#numbers').scrollIntoViewIfNeeded();
        const deck = page.locator('.numbers');
        const entries = page.locator('.numbers-index button');
        await entries.nth(2).click();
        await page.waitForTimeout(700); // focus moved to the button: the timer must not start
        await expect(deck).not.toHaveClass(/playing/);
        await entries.nth(4).click();
        await page.waitForTimeout(700);
        await expect(deck).not.toHaveClass(/playing/);
        await expect(entries.nth(4)).toHaveAttribute('aria-current', '');
        await page.locator('.numbers-sub').hover();
        await expect(deck).toHaveClass(/playing/);
    });

    test('a window that is narrow at load shows the list, then draws the map once it is widened', async ({
        page,
        isMobile
    }) => {
        test.skip(isMobile, 'resizes the window');
        await page.setViewportSize({ width: 800, height: 900 });
        await page.goto('/');
        await page.locator('.work').scrollIntoViewIfNeeded();
        await expect(page.locator('.project-list')).toBeVisible();
        await expect(page.locator('.nm')).toHaveCount(0);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.locator('.work').scrollIntoViewIfNeeded();
        await expect(page.locator('.nm')).toBeVisible();
        await expect(page.locator('.project-list')).toBeHidden();
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
