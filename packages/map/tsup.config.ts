import { defineConfig } from 'tsup';
import baseConfig from '../tsup.config';

export default defineConfig({
    ...baseConfig,
    format: ['cjs', 'esm'],
    external: [/^@packages\//, 'proj4', 'cesium'],
});
