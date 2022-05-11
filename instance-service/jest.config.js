module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    testPathIgnorePatterns: ['.d.ts', '.js'],
    setupFilesAfterEnv: ['./jest.setup.redis-mock.js'],
};
