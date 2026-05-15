// jest.config.js
export default {
    testEnvironment: 'node',
    transform: {},                         // ESM — no transform needed
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterFramework: [],
    globalSetup: './tests/setup/globalSetup.js',
    globalTeardown: './tests/setup/globalTeardown.js',
    setupFilesAfterFramework: ['./tests/setup/setup.js'],
};
