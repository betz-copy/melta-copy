import { Config } from '@jest/types';
import { globSync } from 'glob';

// This file is temporary until we finish migrating all services (and fix their tests)
// One all services migrated, we can remove this file and change pnpm run test to run testing w/ turbo

const projects = globSync('*/jest.config.ts', {
    cwd: __dirname,
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true,
});
const config: Config.InitialOptions = { projects };

export default config;
