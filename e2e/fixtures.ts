import { test as base, expect } from '@playwright/test';

/**
 * `page` that fails the test on any console error, uncaught exception or CSP violation,
 * so every scenario also checks that nothing broke silently.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
    consoleErrors: [
        async ({ page }, use) => {
            const errors: string[] = [];
            page.on('console', (msg) => {
                if (msg.type() === 'error') errors.push(msg.text());
            });
            page.on('pageerror', (err) => errors.push(`Uncaught: ${err.message}`));
            await use(errors);
            expect(errors, 'console errors / CSP violations').toEqual([]);
        },
        { auto: true }
    ]
});

export { expect };
