// Simple Jest configuration using ES modules format
export default {
  // Use Node environment for basic tests to minimize dependencies
  testEnvironment: 'node',
  // File extensions to process
  moduleFileExtensions: ['js', 'mjs', 'json'],
  // Only TypeScript files need explicit ESM handling
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Simple transform setup that respects ES modules
  transform: {},
  // Basic test matching - include both test/ directory and src/**/__tests__/ directories
  testMatch: [
    '**/test/**/*.test.js',
    '**/src/**/__tests__/**/*.test.js'
  ],
  // Jest needs to be told to use --experimental-vm-modules for ESM support
  runner: 'jest-runner',
  testRunner: 'jest-circus/runner'
};
