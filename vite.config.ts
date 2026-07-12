import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                availability: resolve(__dirname, 'availability.html'),
                cv: resolve(__dirname, 'cv.html')
            }
        }
    }
});
