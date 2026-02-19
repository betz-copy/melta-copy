const config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    transformIgnorePatterns: ['/node_modules/(?!(.pnpm|uuid)/)'],
    collectCoverageFrom: [
        '**/*.(t|j)s',
        '!main.ts',
        '!utils/logger/**',
        '!**/**.schema.ts',
        '!common/**',
        '!config/**',
        '!**/cls/**',
        '!**/**.dto.ts',
        '!**/**.module.ts',
        '!**/**.controller.ts',
        '!**/**.factory.ts',
        '!**/messaging/**',
        '!**/zod.ts',
        '!**/interfaces.ts',
        '!utils/**/*.helper.ts',
    ],
    coverageDirectory: '../coverage',
    coveragePathIgnorePatterns: ['/coverage/'],
    testEnvironment: 'node',
    roots: ['<rootDir>', '<rootDir>/../test'],
    testPathIgnorePatterns: ['/coverage/'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/$1',
    },
};

export default config;
