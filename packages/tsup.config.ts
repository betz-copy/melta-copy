import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: {
        resolve: true,
        entry: './src/index.ts',
        compilerOptions: {
            baseUrl: '..',
            paths: {
                '@packages/*': ['*/src'],
            },
        },
    },
    outDir: 'dist',
    target: 'esnext',
    splitting: false,
    clean: true,
    shims: true,
    noExternal: [/^@packages\//],
});
