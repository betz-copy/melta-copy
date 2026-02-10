import { defineConfig } from 'tsup';
import baseConfig from '../tsup.config';

export default defineConfig({
    ...baseConfig,
    external: [/^@packages\//, 'neo4j-driver'],
});
