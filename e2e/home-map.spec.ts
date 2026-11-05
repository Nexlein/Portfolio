import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { MAP_MAX } from '../src/components/NeuralMap/graph';
import { PROJECTS } from '../src/data/projects';

/** The map has finished drawing itself in. */
const mapDrawn = (page: Page) => expect(page.locator('.nm.booted:not(.booting)')).toHaveCount(1, { timeout: 10_000 });

test.describe('project map', () => {
    test.beforeEach(({ isMobile }) => test.skip(isMobile, 'phones get the list'));

    test('a domain chip filters the map, and the same chip clears it', async ({ page }) => {
        // The first click scrolls the map into view: smooth, it would still be moving under the second click
        await page.emulateMedia({ reducedMotion: 'reduce' });
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
        await mapDrawn(page);
        // Graze card A and move on to card B inside the hover-intent delay
        await page.evaluate(() => {
            const [a, b] = [...document.querySelectorAll('.nm-card')];
            const mouse = { pointerType: 'mouse' };
            a.dispatchEvent(new PointerEvent('pointerenter', mouse));
            a.dispatchEvent(new PointerEvent('pointerleave', mouse));
            b.dispatchEvent(new PointerEvent('pointerenter', mouse));
        });
        const where = () => page.evaluate(() => (document.querySelector('.nm-card') as HTMLElement).style.translate);
        const before = await where();
        await expect.poll(where, { timeout: 4000 }).not.toBe(before); // it keeps drifting with the others
    });

    test('resizing while a card is open leaves no stuck badge or open card', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await mapDrawn(page);
        await page.evaluate(() => {
            const card = document.querySelector('.nm-card')!;
            card.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
        });
        await expect(page.locator('.nm-card.near[data-score]').first()).toBeAttached();
        await page.setViewportSize({ width: 1290, height: 800 });
        await expect(page.locator('.nm-card[data-score]')).toHaveCount(0); // the redraw forgets every state
        await page.keyboard.press('Escape');
        await expect(page.locator('.nm-card.open')).toHaveCount(0);
    });

    test('a card unfolding upward still covers the whole closed card', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await mapDrawn(page);
        // A pointer resting on a strip the open card leaves uncovered would close it, land on it again and loop
        const gaps = await page.evaluate(async () => {
            const mouse = { pointerType: 'mouse' };
            const box = document.querySelector('.nm')!.getBoundingClientRect();
            const low = [...document.querySelectorAll<HTMLElement>('.nm-card')].filter((card) => {
                const { top, height } = card.getBoundingClientRect();
                return top + height / 2 > box.top + box.height / 2; // only cards low on the map unfold upward
            });
            const found: string[] = [];
            let up = 0;
            for (const card of low) {
                const closed = card.getBoundingClientRect();
                card.dispatchEvent(new PointerEvent('pointerenter', mouse));
                while (!card.classList.contains('open')) await new Promise(requestAnimationFrame);
                await Promise.allSettled(card.getAnimations().map((a) => a.finished));
                const open = card.getBoundingClientRect();
                if (card.dataset.dir === 'up') {
                    up++;
                    if (open.bottom < closed.bottom - 3) found.push(card.dataset.id!);
                }
                card.dispatchEvent(new PointerEvent('pointerleave', mouse));
                while (card.classList.contains('open')) await new Promise(requestAnimationFrame);
            }
            return { found, up };
        });
        expect(gaps.up).toBeGreaterThan(0);
        expect(gaps.found).toEqual([]);
    });

    test('draws every project and unfolds one on hover, with its similar projects', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        const cards = page.locator('.nm-card');
        await expect(cards).toHaveCount(Math.min(PROJECTS.length, MAP_MAX));
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

    test('after a resize in the list view, the map is laid out again for its new width', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await expect(page.locator('.nm.booted')).toHaveCount(1);
        await page.locator('.work-view button[data-view="list"]').click();
        await page.setViewportSize({ width: 1000, height: 900 });
        await page.locator('.work-view button[data-view="map"]').click();
        await page.locator('.nm').scrollIntoViewIfNeeded(); // the cards move only while the map is on screen
        const outside = () =>
            page.evaluate(() => {
                const box = document.querySelector('.nm')!.getBoundingClientRect();
                return [...document.querySelectorAll('.nm-card')].filter((c) => {
                    const r = c.getBoundingClientRect();
                    return r.right > box.right + 8 || r.left < box.left - 8;
                }).length;
            });
        await expect.poll(outside).toBe(0);
    });

    test('a click unfolds, a second click opens the project page', async ({ page }) => {
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded(); // the map is drawn as the section comes into view
        const card = page.locator('.nm-card[data-id="starttrek"]');
        await card.focus(); // scrolls it into view (Playwright's own scroll waits for a card that never stops drifting)
        await expect(card).toHaveClass(/open/);
        await card.press('Enter');
        await expect(page).toHaveURL(/\/projects\/starttrek\.html$/);
    });

    test('a domain the map has no card for opens the list', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        await page.locator('#work').scrollIntoViewIfNeeded();
        await expect(page.locator('.nm.booted')).toHaveCount(1);
        await page.locator('.nm-card[data-domain="devops"]').evaluateAll((cards) => cards.forEach((c) => c.remove()));
        await page.locator('.query button[data-domain="devops"]').click();
        await expect(page.locator('.work')).toHaveAttribute('data-view', 'list');
        await expect(page.locator('.project-list')).toBeVisible();
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
        for (let shown = 12; shown < PROJECTS.length + 6; shown += 6) {
            await more.click();
            await expect(rows(page)).toHaveCount(Math.min(shown, PROJECTS.length));
        }
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
        // Linux WebKit can keep moving by 1px after restoring the scroll, which Playwright reads as "not stable"
        await page.evaluate(() => (history.scrollRestoration = 'manual'));
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
        const domain = PROJECTS.find((p) => p.category === 'devops')!.category;
        const expected = PROJECTS.filter((p) => p.category === domain).length;
        await page.locator(`.query button[data-domain="${domain}"]`).click();
        await expect(rows(page)).toHaveCount(Math.min(6, expected));
        for (const li of await rows(page).all()) await expect(li.locator('a')).toHaveAttribute('data-domain', domain);
        await page.locator(`.query button[data-domain="${domain}"]`).click();
        await expect(rows(page)).toHaveCount(6);
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
