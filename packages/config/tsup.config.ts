import { defineConfig } from 'tsup';

// Backend-only package - CJS only
export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: true,
    outDir: 'dist',
    target: 'esnext',
    clean: true,
});
