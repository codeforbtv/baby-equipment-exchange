const config = {
    verbose: true,
    preset: 'jest-puppeteer',
    globalSetup: './node_modules/jest-environment-puppeteer/setup',
    globalTeardown: './node_modules/jest-environment-puppeteer/teardown'
};

const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './'
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFiles: ['<rootDir>/dotenv-config.js'],
    setupFilesAfterEnv: ['<rootDir>/setup-tests.ts'],
    verbose: true,
    preset: 'jest-puppeteer',
    globalSetup: './node_modules/jest-environment-puppeteer/setup.js',
    globalTeardown: './node_modules/jest-environment-puppeteer/teardown.js',
    testEnvironment: 'jest-environment-puppeteer'
};

module.exports = createJestConfig(customJestConfig);
