import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sharedHead } from './vite-plugins/shared-head';

// Serve `vite preview` with the same security headers as production, so CSP issues show up locally and in e2e tests
const vercel = JSON.parse(readFileSync(resolve(import.meta.dirname, 'vercel.json'), 'utf8'));
const securityHeaders: Record<string, string> = Object.fromEntries(
    vercel.headers
        .find((rule: { source: string }) => rule.source === '/(.*)')
        .headers.map((h: { key: string; value: string }) => [h.key, h.value])
);

export default defineConfig({
    plugins: [sharedHead()],
    preview: { headers: securityHeaders },
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
