import { defineConfig } from 'tsup';
import baseConfig from '../tsup.config';

export default defineConfig({
    ...baseConfig,
    format: ['cjs', 'esm'],
    external: [/^@packages\//, 'express', 'joi', 'winston', 'winston-daily-rotate-file', 'neo4j-driver', 'proj4', 'mongoose', 'cesium', 'dotenv'],
});
