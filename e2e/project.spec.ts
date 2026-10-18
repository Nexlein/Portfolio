import { test, expect } from './fixtures';
import { PROJECTS } from '../src/data/projects';

const video = PROJECTS.find((p) => p.media.type === 'video' && p.github)!;
const gallery = PROJECTS.find((p) => p.media.type === 'gallery')!;

test.describe('project page', () => {
    test.describe(() => {
        test.use({ playVideos: true }); // WebKit plays no video otherwise (playwright.config.ts)

        test('renders the project, plays its video and links to GitHub', async ({ page }) => {
            await page.goto(`/projects/${video.id}.html`);
            await expect(page).toHaveTitle(`${video.title} — Nexlein`);
            await expect(page.locator('h1')).toHaveText(video.title);
            await expect(page.locator('#project-desc')).toHaveText(video.description.en);
            await expect(page.locator('#project-github')).toHaveAttribute('href', video.github);
            await expect(page.locator('#project-media video')).toHaveJSProperty('paused', false);
        });
    });

    test('the gallery fetches only the pictures it shows or is next to, and a screen reader reads one', async ({
        page
    }) => {
        const loaded: string[] = [];
        page.on('response', (r) => /\/projects\/[^/]+\/[^/]+\.webp$/.test(r.url()) && loaded.push(r.url()));
        await page.goto(`/projects/${gallery.id}.html`, { waitUntil: 'networkidle' });
        const pictures = gallery.media.type === 'gallery' ? gallery.media.images.length : 0;
        const own = loaded.filter((u) => u.includes(`/projects/${gallery.id}/`));
        expect(own.length).toBeGreaterThan(0);
        expect(own.length).toBeLessThan(pictures); // not all of them at load
        await expect(page.locator('#project-media .gallery img[aria-hidden="false"]')).toHaveCount(1);
        await expect(page.locator('#project-media .gallery img[aria-hidden="true"]')).toHaveCount(pictures - 1);
        await page.locator('.gallery-dots button').last().click();
        await expect(page.locator('#project-media .gallery img.active')).toHaveJSProperty('complete', true);
    });

    test('the gallery moves with its arrows, dots and keys', async ({ page }) => {
        await page.goto(`/projects/${gallery.id}.html`);
        const active = page.locator('#project-media .gallery img.active');
        const count = page.locator('.gallery-count');
        await expect(active).toHaveAttribute('data-idx', '0');
        await page.locator('#project-media .next').click();
        await expect(active).toHaveAttribute('data-idx', '1');
        await expect(count).toHaveText(`2 / ${gallery.media.type === 'gallery' ? gallery.media.images.length : 0}`);
        await page.keyboard.press('ArrowLeft');
        await expect(active).toHaveAttribute('data-idx', '0');
        await page.locator('.gallery-dots button').last().click();
        await expect(page.locator('.gallery-dots button').last()).toHaveAttribute('aria-current', 'true');
    });

    test('connected projects lead to other project pages', async ({ page }) => {
        await page.goto(`/projects/${video.id}.html`);
        const card = page.locator('#project-related a').first();
        await card.scrollIntoViewIfNeeded();
        await expect(card.locator('.overlap-fill')).toHaveCSS('width', /^[1-9]/);
        await card.click();
        await expect(page).toHaveURL(/\/projects\/[\w-]+\.html$/);
        await expect(page).not.toHaveURL(new RegExp(`/${video.id}\\.html$`));
    });

    test('the back link returns to the projects on the home page', async ({ page }) => {
        await page.goto(`/projects/${video.id}.html`);
        await page.locator('#project-back').click();
        await expect(page).toHaveURL(/\/#work$/);
        await expect(page.locator('#work h2')).toBeVisible();
    });

    test('the nav links back to the home sections', async ({ page }) => {
        await page.goto(`/projects/${video.id}.html`);
        await expect(page.locator('.nav-link[data-section="hire"]')).toHaveAttribute('href', '/#hire');
        await expect(page.locator('.nav-name')).toHaveAttribute('href', '/');
    });

    test('exists in French, and the toggle switches to the English page', async ({ page }) => {
        await page.goto(`/fr/projects/${video.id}.html`);
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page.locator('#project-desc')).toHaveText(video.description.fr);
        await expect(page.locator('#project-back')).toHaveAttribute('href', '/fr/#work');

        await page.locator('.nav-lang [data-lang="en"]').click();
        await expect(page).toHaveURL(new RegExp(`/projects/${video.id}\\.html$`));
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
});

test.describe('from the home page', () => {
    test('project links open the page in the current language', async ({ page }) => {
        for (const [home, prefix] of [
            ['/', ''],
            ['/fr/', '/fr']
        ]) {
            await page.goto(home);
            await page.locator(`.feature[href$="/projects/${PROJECTS.find((p) => p.featured)!.id}.html"]`).click();
            await expect(page).toHaveURL(new RegExp(`${prefix}/projects/[\\w-]+\\.html$`));
            await expect(page.locator('h1')).toBeVisible();
        }
    });
});
