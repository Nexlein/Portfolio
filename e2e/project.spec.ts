import { test, expect } from './fixtures';
import { PROJECTS } from '../src/data/projects';

const video = PROJECTS.find((p) => p.media.type === 'video' && p.github)!;
const gallery = PROJECTS.find((p) => p.media.type === 'gallery')!;

test.describe('project page', () => {
    test('renders the project, plays its video and links to GitHub', async ({ page }) => {
        await page.goto(`/projects/${video.id}.html`);
        await expect(page).toHaveTitle(`${video.title} — Nexlein`);
        await expect(page.locator('h1')).toHaveText(video.title);
        await expect(page.locator('#project-desc')).toHaveText(video.description.en);
        await expect(page.locator('#project-github')).toHaveAttribute('href', video.github);
        await expect(page.locator('#project-media video')).toHaveJSProperty('paused', false);
    });

    test('gallery arrows work on the page too', async ({ page }) => {
        await page.goto(`/projects/${gallery.id}.html`);
        const active = page.locator('#project-media .modal-gallery img.active');
        await expect(active).toHaveAttribute('data-idx', '0');
        await page.locator('#project-media .next').click();
        await expect(active).toHaveAttribute('data-idx', '1');
    });

    test('the back link returns to the project grid', async ({ page }) => {
        await page.goto(`/projects/${video.id}.html`);
        await page.locator('#project-back').click();
        await expect(page).toHaveURL(/\/#projects$/);
        await expect(page.locator('.project-card').first()).toBeVisible();
    });

    test('the navbar works from a nested page', async ({ page, isMobile }) => {
        await page.goto(`/projects/${video.id}.html`);
        if (isMobile) await page.locator('#mobile-menu-btn').click();
        await expect(page.locator('.nav-link[data-section="projects"]')).toHaveClass(/active/);
        await expect(page.locator('.nav-link[data-section="availability"]')).toHaveAttribute(
            'href',
            '/availability.html'
        );
        await expect(page.locator('.nav-cta')).toHaveAttribute('href', '/#contact');
    });

    test('exists in French, and the toggle switches to the English page', async ({ page, isMobile }) => {
        await page.goto(`/fr/projects/${video.id}.html`);
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page.locator('#project-desc')).toHaveText(video.description.fr);
        await expect(page.locator('#project-back')).toHaveAttribute('href', '/fr/#projects');

        if (isMobile) await page.locator('#mobile-menu-btn').click();
        await page.locator('#nav-lang-btn').click();
        await expect(page).toHaveURL(new RegExp(`/projects/${video.id}\\.html$`));
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
});

test.describe('modal', () => {
    test('links to the project page in the current language', async ({ page }) => {
        for (const [home, prefix] of [
            ['/', ''],
            ['/fr/', '/fr']
        ]) {
            await page.goto(`${home}?project=${video.id}`);
            await page.locator('#modal-page').click();
            await expect(page).toHaveURL(new RegExp(`${prefix}/projects/${video.id}\\.html$`));
            await expect(page.locator('h1')).toHaveText(video.title);
        }
    });
});
