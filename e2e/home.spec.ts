import { test, expect } from './fixtures';
import { PROJECTS } from '../src/data/projects';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';

const PAGE_SIZE = 6;
const cards = '.project-card';
const modal = '#project-modal-backdrop';

test.describe('project grid', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('shows the first page of projects, then more on demand', async ({ page }) => {
        await expect(page.locator(cards)).toHaveCount(PAGE_SIZE);
        await page.locator('#show-more-projects').click();
        await expect(page.locator(cards)).toHaveCount(Math.min(PROJECTS.length, PAGE_SIZE * 2));
    });

    test('filters by year and hides categories with no project that year', async ({ page }) => {
        const tek1 = PROJECTS.filter((p) => p.year === 'Tek1');
        await page.locator('.year-filter[data-year="Tek1"]').click();

        await expect(page.locator(cards)).toHaveCount(Math.min(tek1.length, PAGE_SIZE));
        for (const btn of await page.locator('.cat-filter').all()) {
            const cat = await btn.getAttribute('data-filter');
            const expected = cat === 'all' || tek1.some((p) => p.category === cat);
            await expect(btn).toBeVisible({ visible: expected });
        }
    });

    test('falls back to all categories when the selection becomes empty', async ({ page }) => {
        await page.locator('.year-filter[data-year="Tek1"]').click();
        await page.locator('.cat-filter[data-filter="graphical"]').click();
        await page.locator('.year-filter[data-year="Personal"]').click();

        await expect(page.locator('.cat-filter.active')).toHaveAttribute('data-filter', 'all');
        await expect(page.locator(cards)).toHaveCount(PROJECTS.filter((p) => p.year === 'Personal').length);
    });
});

test.describe('project modal', () => {
    test('opens from a card and closes with Escape', async ({ page }) => {
        await page.goto('/');
        const first = PROJECTS[0];
        await page.locator(`${cards}[data-project-id="${first.id}"]`).click();

        await expect(page.locator(modal)).toBeVisible();
        await expect(page.locator('#modal-title')).toHaveText(first.title);
        await expect(page.locator('#modal-desc')).toHaveText(first.description.en);

        await page.keyboard.press('Escape');
        await expect(page.locator(modal)).toBeHidden();
    });

    test('keeps the closed modal out of reach of keyboard and screen readers', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator(modal)).toBeHidden();
        // visibility: hidden removes it from the tab order and accessibility tree
        await page.locator('#modal-github').focus();
        await expect(page.locator('#modal-github')).not.toBeFocused();
    });

    test('deep link opens any project, even beyond the first page', async ({ page }) => {
        const last = PROJECTS[PROJECTS.length - 1];
        await page.goto(`/?project=${last.id}`);
        await expect(page.locator(modal)).toBeVisible();
        await expect(page.locator('#modal-title')).toHaveText(last.title);
    });

    test('gallery arrows cycle through images', async ({ page }) => {
        const gallery = PROJECTS.find((p) => p.media.type === 'gallery');
        test.skip(!gallery, 'no gallery project');
        await page.goto(`/?project=${gallery!.id}`);

        const active = page.locator('.modal-gallery img.active');
        await expect(active).toHaveAttribute('data-idx', '0');
        await page.locator('.modal-gallery .next').click();
        await expect(active).toHaveAttribute('data-idx', '1');
        await page.locator('.modal-gallery .prev').click();
        await page.locator('.modal-gallery .prev').click();
        if (gallery?.media.type === 'gallery') {
            await expect(active).toHaveAttribute('data-idx', String(gallery.media.images.length - 1));
        }
    });
});

test.describe('videos', () => {
    test('card videos download only once scrolled into view, then play', async ({ page }) => {
        const videoRequests: string[] = [];
        page.on('request', (req) => {
            if (req.url().endsWith('.mp4')) videoRequests.push(req.url());
        });

        await page.goto('/', { waitUntil: 'networkidle' });
        expect(videoRequests, 'no video before scrolling').toEqual([]);

        const firstVideo = page.locator(`${cards} video`).first();
        await firstVideo.scrollIntoViewIfNeeded();
        await expect(firstVideo).toHaveJSProperty('paused', false);
        expect(videoRequests.length).toBeGreaterThan(0);
    });

    test('with reduced motion, cards keep their poster and never autoplay', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        await page.locator(`${cards} video`).first().scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        for (const video of await page.locator(`${cards} video`).all()) {
            await expect(video).toHaveJSProperty('paused', true);
            await expect(video).toHaveAttribute('poster', /\.poster\.webp$/);
        }
    });
});

test.describe('language', () => {
    const projectsTitle = '[data-i18n="projects.title"]';

    test('the toggle opens the same page in the other language and remembers it', async ({ page, isMobile }) => {
        await page.goto('/?project=arcade');
        await page.keyboard.press('Escape');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator(projectsTitle)).toHaveText(en.projects.title);

        if (isMobile) await page.locator('#mobile-menu-btn').click(); // the toggle lives in the mobile menu
        await page.locator('#nav-lang-btn').click();
        await expect(page).toHaveURL(/\/fr\/\?project=arcade$/);
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page).toHaveTitle(fr.meta.home.title);
        await expect(page.locator(projectsTitle)).toHaveText(fr.projects.title);
        await expect(page.locator('#modal-desc')).toHaveText(PROJECTS.find((p) => p.id === 'arcade')!.description.fr); // runtime content too

        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('fr');
    });

    test('French browsers are sent to the French page on their first visit', async ({ browser }) => {
        const context = await browser.newContext({ locale: 'fr-FR' });
        const page = await context.newPage();
        await page.goto('/availability.html');
        await expect(page).toHaveURL(/\/fr\/availability\.html$/);
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

    test('the French home page embeds the French CV', async ({ page }) => {
        await page.goto('/fr/');
        await page.locator('#hero-cv-link').click();
        const cv = page.frameLocator('#cv-iframe');
        await expect(cv.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(cv.locator('[data-i18n="cv.controls.print"]')).toHaveText(fr.cv.controls.print);
    });
});

test('CV opens in a modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('#hero-cv-link').click();
    await expect(page.locator('#cv-modal-backdrop')).toBeVisible();
    await expect(page.frameLocator('#cv-iframe').locator('.page')).toBeVisible();
});

test('mobile menu opens and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'menu button only exists on small screens');
    await page.goto('/');
    const links = page.locator('#topnav-links');
    await page.locator('#mobile-menu-btn').click();
    await expect(links).toHaveClass(/open/);
    await links.locator('.nav-link').first().click();
    await expect(links).not.toHaveClass(/open/);
});
