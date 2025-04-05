/** @type {import('jest').Config} */
module.exports = {
  // Use Node environment for basic tests
  testEnvironment: 'node',
  // Standard file extensions
  moduleFileExtensions: ['js', 'json'],
  // Very simple transform setup
  transform: {},
  // Minimal test matching
  testMatch: ['**/test/**/*.test.js']
};
