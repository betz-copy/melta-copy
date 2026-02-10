import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';
import { environment } from './src/globals';

const { cesiumBaseUrl } = environment.cesium;

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
        global: 'window',
    },
    plugins: [
        react({
            babel: {
                plugins: [
                    [
                        '@locator/babel-jsx/dist',
                        {
                            env: 'development',
                        },
                    ],
                ],
            },
        }),
        cesium(),
    ],
    server: {
        port: 3000,
        host: true,
        hmr: {
            port: 3001,
        },
    },
    build: {
        rollupOptions: {
            external: [/^@packages\//],
        },
    },
});
