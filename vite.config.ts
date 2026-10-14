/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sharedHead } from './vite-plugins/shared-head.ts';
import { sitePages } from './vite-plugins/pages.ts';

// Serve `vite preview` with the same security headers as production, so CSP issues show up locally and in e2e tests
const vercel = JSON.parse(readFileSync(resolve(import.meta.dirname, 'vercel.json'), 'utf8'));
const securityHeaders: Record<string, string> = Object.fromEntries(
    vercel.headers
        .find((rule: { source: string }) => rule.source === '/(.*)')
        .headers.map((h: { key: string; value: string }) => [h.key, h.value])
);
// WebKit applies upgrade-insecure-requests to http://localhost, so every asset would fail locally (it matters on https only)
securityHeaders['Content-Security-Policy'] = securityHeaders['Content-Security-Policy'].replace(
    '; upgrade-insecure-requests',
    ''
);

export default defineConfig({
    plugins: [sharedHead(), sitePages()],
    // Vercel sets VERCEL=1 during its builds: only those deployments serve the analytics script
    define: { IS_VERCEL_BUILD: JSON.stringify(process.env.VERCEL === '1') },
    preview: { headers: securityHeaders },
    test: {
        include: ['src/**/*.test.ts'], // e2e/ holds Playwright browser tests
        // Pages parsed in tests link to files that no server serves: skip them, and do not report that as an error
        environmentOptions: {
            happyDOM: {
                settings: {
                    disableCSSFileLoading: true,
                    disableJavaScriptFileLoading: true,
                    handleDisabledFileLoadingAsSuccess: true
                }
            }
        }
    },
    resolve: {
        alias: { '@': resolve(import.meta.dirname, 'src') }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                cv: resolve(import.meta.dirname, 'cv.html'),
                notfound: resolve(import.meta.dirname, '404.html'),
                project: resolve(import.meta.dirname, 'project.html') // template for /projects/<id>.html
            }
        }
    }
});
