import { defineConfig } from 'tsup';
import baseConfig from '../tsup.config';

// Backend-only package - CJS only
export default defineConfig({
    ...baseConfig,
    format: ['cjs'],
    external: [/^@packages\//, 'express', 'joi', 'winston', 'winston-daily-rotate-file', 'neo4j-driver', 'proj4', 'mongoose'],
});
