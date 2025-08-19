import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { environment } from './src/globals';

const { cesiumBaseUrl, cesiumSource } = environment.cesium;

const cesiumCopyTargets = [
    { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
];

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
        global: 'window',
    },
    plugins: [react(), cesium(), viteStaticCopy({ targets: cesiumCopyTargets })],
    server: {
        port: 3000,
        host: true,
        hmr: {
            port: 3001,
        },
    },
});
