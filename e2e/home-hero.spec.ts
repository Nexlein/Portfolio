import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { en } from '../src/i18n/en';

/** Counts the animation frames the page asks for, from its first script on. */
async function countFrames(page: Page): Promise<() => Promise<number>> {
    await page.addInitScript(() => {
        const w = window as unknown as { frames: number };
        w.frames = 0;
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (cb) => (w.frames++, raf(cb));
    });
    return () => page.evaluate(() => (window as unknown as { frames: number }).frames);
}

/** Waits for a stretch without a new frame (the one queued and the intro counters run out first); returns the count. */
async function untilIdle(page: Page, frames: () => Promise<number>): Promise<number> {
    let idle = 0;
    await expect
        .poll(
            async () => {
                const before = await frames();
                await page.waitForTimeout(600);
                idle = await frames();
                return idle - before;
            },
            { message: 'no frame is requested', timeout: 15_000 }
        )
        .toBe(0);
    return idle;
}

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

    test('stops asking for frames while the tab is hidden, and resumes when it is shown again', async ({ page }) => {
        const frames = await countFrames(page);
        await page.goto('/');
        const setHidden = (hidden: boolean) =>
            page.evaluate((h) => {
                Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
                document.dispatchEvent(new Event('visibilitychange'));
            }, hidden);
        await expect.poll(frames, { timeout: 15000 }).toBeGreaterThan(10); // the hero draws (slowly on a loaded runner)
        await setHidden(true);
        const idle = await untilIdle(page, frames);
        await setHidden(false);
        await expect.poll(frames, { timeout: 15000 }).toBeGreaterThan(idle + 5);
    });

    test('the pause button holds the simulation still, and a second press sets it going again', async ({ page }) => {
        const frames = await countFrames(page);
        await page.goto('/');
        const pause = page.locator('.hero-pause');
        await expect(pause).toHaveAccessibleName(en.home.hero.pause);
        await expect.poll(frames, { timeout: 15000 }).toBeGreaterThan(10);
        await pause.click();
        await expect(pause).toHaveAttribute('aria-pressed', 'true');
        const idle = await untilIdle(page, frames);
        await pause.click();
        await expect(pause).toHaveAttribute('aria-pressed', 'false');
        await expect.poll(frames, { timeout: 15000 }).toBeGreaterThan(idle + 5);
    });

    test('a simulation picked during a pause shows its picture, and keeps it through a resize', async ({
        page,
        isMobile
    }) => {
        test.skip(isMobile, 'a phone keeps its size');
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');
        await page.locator('.hero-pause').click();
        await page.locator('.hero-dot[aria-pressed="false"]').first().click();
        await expect.poll(() => painted(page)).toBe(true);
        await resized(page);
        await expect.poll(() => painted(page)).toBe(true);
    });

    test('starts moving when reduced motion is turned off, and holds still when it comes back', async ({
        page,
        isMobile
    }) => {
        test.skip(isMobile, 'a phone keeps its size');
        const frames = await countFrames(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');
        await expect.poll(() => painted(page)).toBe(true);
        await expect(page.locator('.hero-pause')).toBeHidden();
        const idle = await untilIdle(page, frames);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await expect.poll(frames, { timeout: 15000 }).toBeGreaterThan(idle + 5);
        await expect(page.locator('.hero-pause')).toBeVisible();
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await resized(page);
        await expect.poll(() => painted(page)).toBe(true);
    });

    test('a resize that changes nothing leaves the canvas alone', async ({ page }) => {
        await page.goto('/');
        await page.locator('.hero-pause').click();
        const marked = () =>
            page.evaluate(() => {
                const canvas = document.querySelector<HTMLCanvasElement>('.hero-field')!;
                return canvas.getContext('2d')!.getImageData(0, 0, 1, 1).data[3] === 255;
            });
        await page.evaluate(() => {
            const ctx = document.querySelector<HTMLCanvasElement>('.hero-field')!.getContext('2d')!;
            ctx.fillStyle = '#f00';
            ctx.fillRect(0, 0, 4, 4);
            window.dispatchEvent(new Event('resize')); // a phone's address bar sliding away
        });
        await page.waitForTimeout(300); // past the resize debounce: the clear this guards against would have happened
        expect(await marked()).toBe(true);
    });

    test('old project links (/?project=id) open the project page', async ({ page }) => {
        await page.goto('/?project=arcade');
        await expect(page).toHaveURL(/\/projects\/arcade\.html$/);
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

    test('screen readers keep the first wording while the line changes', async ({ page }) => {
        await page.goto('/');
        const shown = page.locator('.hero h1 [data-i18n="home.hero.title2"]');
        await expect(shown).not.toHaveText(en.home.hero.title2, { timeout: 12_000 });
        await expect(page.locator('.hero h1')).toHaveAccessibleName(`${en.home.hero.title1} ${en.home.hero.title2}`);
    });
});

/** Resize the window and wait for the canvas to take the new size, which clears it (it happens after a debounce). */
async function resized(page: Page): Promise<void> {
    const width = () => page.locator('canvas.hero-field').evaluate((c: HTMLCanvasElement) => c.width);
    const before = await width();
    await page.setViewportSize({ width: 1100, height: 700 });
    await expect.poll(width).not.toBe(before);
}

const painted = (page: Page) =>
    page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('.hero-field')!;
        const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
        return false;
    });

test.describe('hero with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the still picture is drawn again after a resize and a theme change', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');
        await expect.poll(() => painted(page)).toBe(true);
        await resized(page);
        await expect.poll(() => painted(page)).toBe(true);
        await page.locator('.nav-theme-btn').click();
        await page.locator('[data-theme-id="daylight"]').click();
        await expect.poll(() => painted(page)).toBe(true);
    });
});
