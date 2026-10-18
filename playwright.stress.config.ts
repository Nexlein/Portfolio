import base from './playwright.config';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    ...base,
    reporter: [['list'], ['json', { outputFile: '/tmp/wkstress/report.json' }]],
    webServer: undefined,
    projects: [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }]
});
