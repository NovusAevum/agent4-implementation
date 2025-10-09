// Load environment variables from .env file
require('dotenv').config();

export const config = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // LLM Providers
  DEFAULT_LLM_PROVIDER: process.env.DEFAULT_LLM_PROVIDER || 'mock',
  FALLBACK_ORDER: (process.env.FALLBACK_ORDER || 'mock').split(',').map(s => s.trim()),
  
  // API Keys (with empty defaults for testing)
  CONTINUE_API_KEY: process.env.CONTINUE_API_KEY || 'test-continue-key',
  ALIBABA_QWEN_API_KEY: process.env.ALIBABA_QWEN_API_KEY || 'test-alibaba-key',
  KIMI_API_KEY: process.env.KIMI_API_KEY || 'test-kimi-key',
  CODECOPILOT_KEY: process.env.CODECOPILOT_KEY || 'test-codestral-key',
  HF_TOKEN: process.env.HF_TOKEN || 'test-hf-token',
  
  // API Timeouts (in ms)
  REQUEST_TIMEOUT: 30000, // 30 seconds
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Feature flags
  ENABLE_METRICS: process.env.ENABLE_METRICS !== 'false',
  ENABLE_TRACING: process.env.ENABLE_TRACING !== 'false',
};
