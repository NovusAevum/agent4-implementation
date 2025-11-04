// This file ensures test environment is properly set up
import { config } from './config/index';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FALLBACK_ORDER = 'mock';
process.env.DEFAULT_LLM_PROVIDER = 'mock';

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
});

// Export a test configuration
export const testConfig = {
  ...config,
  // Override configurations for testing
  FALLBACK_ORDER: ['mock'],
  DEFAULT_LLM_PROVIDER: 'mock',
  // Disable other providers for testing
  CONTINUE_API_KEY: '',
  ALIBABA_QWEN_API_KEY: '',
  KIMI_API_KEY: '',
  CODECOPILOT_KEY: '',
  HF_TOKEN: '',
};
