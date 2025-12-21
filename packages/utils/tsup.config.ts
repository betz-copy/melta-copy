import { defineConfig } from 'tsup';

// Backend-only package - CJS only
export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: false, // Disable DTS generation due to memory issues, services will use TypeScript's source types
    outDir: 'dist',
    target: 'esnext',
    clean: true,
    external: ['mongoose', 'mongodb', 'express', 'joi', 'winston', 'winston-daily-rotate-file', 'neo4j-driver', 'proj4'],
});
