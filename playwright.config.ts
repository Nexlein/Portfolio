import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const CI = !!process.env.CI;

/**
 * Browser tests against the production build (`dist/`), served by `vite preview`
 * with the same security headers as Vercel (see vite.config.ts).
 * Run locally with `npm run test:e2e` (builds first).
 */
export default defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    forbidOnly: CI,
    retries: 0, // a test that needs a second try is a bug to fix, not noise to hide
    reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure'
    },
    webServer: {
        command: `npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !CI
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } },
        // The other engines run in CI only (locally: npx playwright install firefox webkit, then CI=1 npx playwright test)
        ...(CI
            ? [
                  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
                  { name: 'webkit', use: { ...devices['Desktop Safari'] } }
              ]
            : [])
    ]
});
