// This file ensures test environment is properly set up
import { config } from './config/index';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FALLBACK_ORDER = 'huggingface';
process.env.DEFAULT_LLM_PROVIDER = 'huggingface';
process.env.HF_TOKEN = 'test-token-for-jest';

// Mock console methods to keep test output clean

beforeAll(() => {
  // Setup any global test configurations
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  // Restore original console methods
  jest.restoreAllMocks();

  // Restore environment variables
  delete process.env.NODE_ENV;
  delete process.env.FALLBACK_ORDER;
  delete process.env.DEFAULT_LLM_PROVIDER;
  delete process.env.HF_TOKEN;
});

// Export a test configuration
export const testConfig = {
  ...config,
  // Override configurations for testing
  FALLBACK_ORDER: ['huggingface'],
  DEFAULT_LLM_PROVIDER: 'huggingface',
  HF_TOKEN: 'test-token-for-jest',
};
