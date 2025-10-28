module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testTimeout: 10000,
  verbose: true,
  resetMocks: true,
  clearMocks: true,
  resetModules: true,
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch)/)'
  ],
  moduleNameMapper: {
    '^node-fetch$': '<rootDir>/node_modules/node-fetch/lib/index.js'
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  moduleDirectories: ['node_modules', 'src'],
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
};
