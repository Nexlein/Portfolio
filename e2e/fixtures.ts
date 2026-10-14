import { test as base, expect } from '@playwright/test';

/**
 * `page` that fails the test on any console error, uncaught exception or CSP violation,
 * so every scenario also checks that nothing broke silently.
 */
/** Firefox reports a font download cut short by a redirect (status NS_BINDING_ABORTED) as an error: it is not one. */
const abortedByNavigation = (text: string) =>
    text.includes('downloadable font: download failed') && text.includes('status=2152398850');

export const test = base.extend<{ consoleErrors: string[] }>({
    consoleErrors: [
        async ({ page }, use) => {
            const errors: string[] = [];
            page.on('console', (msg) => {
                if (msg.type() === 'error' && !abortedByNavigation(msg.text())) errors.push(msg.text());
            });
            page.on('pageerror', (err) => errors.push(`Uncaught: ${err.message}`));
            await use(errors);
            expect(errors, 'console errors / CSP violations').toEqual([]);
        },
        { auto: true }
    ]
});

export { expect };
