// Jest configuration optimized for TaskMan's modular architecture
export default {
  // Use babel-jest to transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  // Only TypeScript files need explicit ESM handling
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Test environment for React components
  testEnvironment: 'jsdom',
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'cjs'],
  // Mock file imports
  moduleNameMapper: {
    '\\.(css|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  // Where to find tests - explicitly include .cjs files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)', 
    '**/__tests__/**/*.cjs',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/?(*.)+(spec|test).cjs'
  ],
  // Don't transform some node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.mjs$)'
  ],
  // Setup file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
