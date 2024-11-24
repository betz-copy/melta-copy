import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), commonjs()],
    server: {
        port: 3000,
        host: true,
        hmr: {
            port: 3001,
        },
    },

    optimizeDeps: {
        include: ['@microservices/shared'],
    },
});
