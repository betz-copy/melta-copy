import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        host: true,
        hmr: {
            port: 3001,
        },
    },
    optimizeDeps: {
        exclude: ['problematic-module'], // Add the module causing the issue here
    },
});
