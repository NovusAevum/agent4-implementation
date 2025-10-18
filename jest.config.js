module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testTimeout: 10000,
  verbose: true,
  // Reset mocks between tests
  resetMocks: true,
  // Clear mock calls between tests
  clearMocks: true,
  // Reset modules between tests
  resetModules: true,
  // Handle ESM modules like node-fetch
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch)/)'
  ],
  // Mock node-fetch for tests
  moduleNameMapper: {
    '^node-fetch$': '<rootDir>/node_modules/node-fetch/lib/index.js'
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};
