import { Config } from '@jest/types';
import { globSync } from 'glob';

const projects = globSync('*/jest.config.ts', {
    cwd: __dirname,
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true,
});
const config: Config.InitialOptions = { projects };

export default config;
