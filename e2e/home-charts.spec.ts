import { test, expect } from './fixtures';
import { monthName, yearOf } from '../src/core/time';
import { CHECKPOINTS } from '../src/data/profile';

test.describe('charts', () => {
    test('the range buttons change the plot', async ({ page }) => {
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        await chart.locator('.path-range button[data-range="1y"]').click();
        await expect(chart.locator('.path-range button[data-range="1y"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(chart.locator('.path-svg')).toHaveCount(1);
    });

    test('a point is explained on hover, on every range', async ({ page, isMobile }) => {
        test.skip(isMobile, 'needs a mouse');
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        await chart.locator('.path-range button[data-range="1y"]').click();
        await expect(chart).toHaveClass(/\bin\b/); // revealed: no longer moving
        const hit = chart.locator('.hit');
        const box = (await hit.boundingBox())!;
        await hit.hover({ position: { x: box.width * 0.6, y: box.height / 2 }, force: true });
        await expect(chart.locator('.path-tip')).toBeVisible();
        // Back and forth: each range keeps its plot, and the one that comes back still answers the pointer
        await chart.locator('.path-range button[data-range="max"]').click();
        await chart.locator('.path-range button[data-range="1y"]').click();
        await expect(chart.locator('.path-tip')).toBeHidden();
        await expect(chart.locator('.path-svg')).toHaveCount(1);
        await chart.locator('.hit').hover({ position: { x: box.width * 0.3, y: box.height / 2 }, force: true });
        await expect(chart.locator('.path-tip')).toBeVisible();
    });

    test('a tap explains a point, and a tap elsewhere puts it away', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'phones only');
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        await expect(chart).toHaveClass(/\bin\b/);
        const box = (await chart.locator('.hit').boundingBox())!;
        await page.touchscreen.tap(box.x + box.width * 0.6, box.y + box.height / 2);
        await expect(chart.locator('.path-tip')).toBeVisible();
        await page.touchscreen.tap(box.x + box.width / 2, box.y - 40);
        await expect(chart.locator('.path-tip')).toBeHidden();
    });

    test('the tooltip on a checkpoint gives its month and its own name', async ({ page, isMobile }) => {
        test.skip(isMobile, 'needs a mouse');
        const last = CHECKPOINTS[CHECKPOINTS.length - 1];
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        await expect(chart).toHaveClass(/\bin\b/);
        await chart.locator(`.mark[data-cp="${last.id}"] .mark-hit`).hover({ force: true });
        await expect(chart.locator('.path-tip .mono')).toHaveText(
            new RegExp(`^${monthName(yearOf(last.date), 'en')} · year \\d$`)
        );
        await expect(chart.locator('.path-tip span').last()).toHaveText(last.label.en);
    });

    test('the headline follows the range, like a price chart', async ({ page }) => {
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        const delta = chart.locator('.path-delta');
        for (const [range, words] of [
            ['max', /^▲ \+\d+ since /],
            ['1y', /^(▲ \+\d+ \(\d+%\)|0 \(0%\)) past 12 months$/], // 0 after a year without a new skill
            ['6m', /past 6 months$/],
            ['1m', /past month$/]
        ] as const) {
            await chart.locator(`.path-range [data-range="${range}"]`).click();
            await expect(chart.locator(`.path-range [data-range="${range}"]`)).toHaveAttribute('aria-pressed', 'true');
            await expect(delta).toHaveText(words);
        }
        await expect(chart.locator('.path-total .count')).toHaveText(/^\d+$/); // the total itself stays the total
    });

    test('the chart shows where the visitor was, and the tooltip names the school year', async ({ page, isMobile }) => {
        test.skip(isMobile, 'needs a mouse and room for the labels');
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        // Before Epitech, then one per school year: the build's date adds years, data.test.ts has the exact ones
        expect(await chart.locator('.phase').count()).toBeGreaterThanOrEqual(4);
        await expect(chart.locator('.phase-label', { hasText: 'year 2 · 2025-26' })).toBeVisible();
        await expect(chart).toHaveClass(/\bin\b/);
        const hit = chart.locator('.hit');
        const box = (await hit.boundingBox())!;
        await hit.hover({ position: { x: box.width * 0.6, y: box.height / 2 }, force: true });
        await expect(chart.locator('.path-tip .mono')).toHaveText(/\d{4} · (year \d|Before Epitech)/);
    });

    test('the tooltip stays inside a narrow screen', async ({ page, isMobile }) => {
        test.skip(isMobile, 'needs a mouse');
        await page.setViewportSize({ width: 390, height: 800 });
        await page.goto('/');
        const chart = page.locator('.path-chart');
        await chart.scrollIntoViewIfNeeded();
        await expect(chart).toHaveClass(/\bin\b/);
        const hit = chart.locator('.hit');
        const box = (await hit.boundingBox())!;
        await hit.hover({ position: { x: box.width - 1, y: box.height / 2 }, force: true });
        const tip = chart.locator('.path-tip');
        await expect(tip).toBeVisible();
        expect(await tip.evaluate((el) => el.getBoundingClientRect().right)).toBeLessThanOrEqual(390);
    });

    test('the numbers are a deck: one chart in front, the arrows and the index bring another one forward', async ({
        page,
        isMobile
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
        if (!isMobile) {
            const third = page.locator('.numbers-index button').nth(3); // the index is desktop only
            await third.click();
            await expect(third).toHaveAttribute('aria-current', 'true');
        }
        await expect(page.locator('.chart-card[data-pos="0"]')).toHaveCount(1);
        expect(await stage.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    });

    test('a click on a card peeking behind the front one brings it forward', async ({ page }) => {
        await page.goto('/');
        await page.locator('.numbers-row').scrollIntoViewIfNeeded();
        const front = page.locator('.chart-card[data-pos="0"] .card-k');
        const first = await front.textContent();
        const peek = await page.evaluate(() => {
            const back = document.querySelector('.chart-card[data-pos="1"]')!.getBoundingClientRect();
            const top = document.querySelector('.chart-card[data-pos="0"]')!.getBoundingClientRect();
            return { x: (back.left + back.right) / 2, y: (back.top + top.top) / 2 };
        });
        await page.mouse.click(peek.x, peek.y);
        await expect(front).not.toHaveText(first!);
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
        await page.locator('.path-range [data-range="1y"]').click();
        await expect(page.locator('.exp.on')).toHaveCount(1);
        await expect(page.locator('.path-svg .mark.on')).toHaveCount(1);
        await expect(page.locator('.exp-count')).toHaveText(/^1 \/ \d+$/);
    });

    test('moving the pointer about or changing focus does not restart the story timer', async ({ page, isMobile }) => {
        test.skip(isMobile, 'needs a mouse');
        await page.setViewportSize({ width: 1280, height: 2400 }); // the story and the numbers on screen together
        await page.goto('/');
        await page.locator('#numbers').scrollIntoViewIfNeeded();
        await page.mouse.move(2, 2);
        await expect(page.locator('.exp-card')).toHaveClass(/playing/); // the timer runs
        // Every restart drops `playing` for a moment. On a slow runner the step can end during the test, and the story
        // turns (its count changes): only a restart without a turn is a bug
        await page.evaluate(() => {
            const log: string[] = [];
            for (const type of ['pointerover', 'pointerout', 'focusin', 'focusout', 'visibilitychange'])
                document.addEventListener(
                    type,
                    (e) => log.push(`${type} ${(e.target as Element)?.className ?? ''}`),
                    true
                );
            const w = window as unknown as { log: string[]; restarts: number };
            w.log = log;
            w.restarts = 0;
            const card = document.querySelector('.exp-card')!;
            const count = card.querySelector('.exp-count')!;
            let seen = count.textContent;
            new MutationObserver((records) => {
                const turned = count.textContent !== seen;
                seen = count.textContent;
                if (!turned && records.some((r) => /\bplaying\b/.test(r.oldValue ?? ''))) w.restarts++;
            }).observe(card, { attributeFilter: ['class'], attributeOldValue: true });
        });
        // The pointer crosses the numbers part (index, arrows, section text)
        await page.locator('.numbers-sub').hover();
        await page.locator('.numbers-index button').nth(2).hover();
        await page.locator('.numbers-nav button').first().hover();
        await page.mouse.move(2, 2); // one jump: a few steps in between could cross the chart or the story, which does pause it
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        const { log, restarts } = await page.evaluate(() => {
            const w = window as unknown as { log: string[]; restarts: number };
            return { log: w.log, restarts: w.restarts };
        });
        expect(restarts, `the timer did not restart: ${log.join(' | ')}`).toBe(0);
    });

    test('the timers pause only on the chart plot, the range buttons and the panel, not on the rest of the block', async ({
        page,
        isMobile
    }) => {
        test.skip(isMobile, 'needs a mouse');
        await page.setViewportSize({ width: 1280, height: 2400 });
        await page.goto('/');
        await expect(page.locator('.work')).toHaveAttribute('data-view', 'map'); // the layout above has settled
        // The chart, the story and the deck all fit on screen from here. The hovers are forced: waiting for the chart
        // to be "stable" made Playwright scroll the story out of view
        const chart = page.locator('.path-chart');
        await chart.evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 120)); // clear of the sticky nav
        // A forced hover aims where the target is when it starts: let the chart finish sliding in (its reveal) first,
        // or the pointer can land beside a range button that is still moving, and the story plays on
        await expect(chart).toHaveClass(/\bin\b/);
        await chart.evaluate((el) => Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(() => {}));
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
        await expect(entries.nth(2)).toHaveAttribute('aria-current', 'true'); // the timer starts here, or never
        await expect(deck).not.toHaveClass(/playing/);
        await entries.nth(4).click();
        await expect(entries.nth(4)).toHaveAttribute('aria-current', 'true');
        await expect(deck).not.toHaveClass(/playing/);
        await page.locator('.numbers-sub').hover();
        await expect(deck).toHaveClass(/playing/);
    });
});
