/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sharedHead } from './vite-plugins/shared-head';
import { i18nPages } from './vite-plugins/i18n-pages';

// Serve `vite preview` with the same security headers as production, so CSP issues show up locally and in e2e tests
const vercel = JSON.parse(readFileSync(resolve(import.meta.dirname, 'vercel.json'), 'utf8'));
const securityHeaders: Record<string, string> = Object.fromEntries(
    vercel.headers
        .find((rule: { source: string }) => rule.source === '/(.*)')
        .headers.map((h: { key: string; value: string }) => [h.key, h.value])
);

export default defineConfig({
    plugins: [sharedHead(), i18nPages()],
    // Vercel sets VERCEL=1 during its builds: only those deployments serve the analytics script
    define: { IS_VERCEL_BUILD: JSON.stringify(process.env.VERCEL === '1') },
    preview: { headers: securityHeaders },
    test: {
        include: ['src/**/*.test.ts'] // e2e/ holds Playwright browser tests
    },
    resolve: {
        alias: { '@': resolve(import.meta.dirname, 'src') }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                availability: resolve(import.meta.dirname, 'availability.html'),
                cv: resolve(import.meta.dirname, 'cv.html')
            }
        }
    }
});
