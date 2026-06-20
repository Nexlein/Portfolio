import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                ailab: resolve(__dirname, 'ailab.html'),
                availability: resolve(__dirname, 'availability.html'),
                cv: resolve(__dirname, 'cv.html')
            }
        }
    }
});
