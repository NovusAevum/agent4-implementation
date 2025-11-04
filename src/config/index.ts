import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // API Keys (all optional with test defaults)
  HF_TOKEN: z.string().optional(),
  ALIBABA_QWEN_API_KEY: z.string().optional(),
  KIMI_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  CODESTRAL_API_KEY: z.string().optional(),
  CONTINUE_API_KEY: z.string().optional(),
  CODECOPILOT_KEY: z.string().optional(),

  // Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DEFAULT_LLM_PROVIDER: z.string().default('mock'),
  FALLBACK_ORDER: z.string().default('mock'),
  LOG_LEVEL: z.string().default('info'),
  ENABLE_METRICS: z.string().default('true'),
  ENABLE_TRACING: z.string().default('true'),
});

const rawConfig = envSchema.parse({
  ...process.env,
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEFAULT_LLM_PROVIDER: process.env.DEFAULT_LLM_PROVIDER || 'mock',
  FALLBACK_ORDER: process.env.FALLBACK_ORDER || 'mock',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_METRICS: process.env.ENABLE_METRICS || 'true',
  ENABLE_TRACING: process.env.ENABLE_TRACING || 'true',
});

// Transform and enhance the config with proper types and defaults
export const config = {
  // Server configuration
  NODE_ENV: rawConfig.NODE_ENV,
  PORT: parseInt(rawConfig.PORT, 10),

  // LLM Providers
  DEFAULT_LLM_PROVIDER: rawConfig.DEFAULT_LLM_PROVIDER,
  FALLBACK_ORDER: rawConfig.FALLBACK_ORDER.split(',').map((s) => s.trim()),

  // API Keys (with test defaults for development)
  CONTINUE_API_KEY: rawConfig.CONTINUE_API_KEY || 'test-continue-key',
  ALIBABA_QWEN_API_KEY: rawConfig.ALIBABA_QWEN_API_KEY || 'test-alibaba-key',
  KIMI_API_KEY: rawConfig.KIMI_API_KEY || 'test-kimi-key',
  CODECOPILOT_KEY: rawConfig.CODECOPILOT_KEY || 'test-codestral-key',
  HF_TOKEN: rawConfig.HF_TOKEN || 'test-hf-token',
  MISTRAL_API_KEY: rawConfig.MISTRAL_API_KEY || 'test-mistral-key',
  DEEPSEEK_API_KEY: rawConfig.DEEPSEEK_API_KEY || 'test-deepseek-key',
  OPENROUTER_API_KEY: rawConfig.OPENROUTER_API_KEY || 'test-openrouter-key',
  CODESTRAL_API_KEY: rawConfig.CODESTRAL_API_KEY || 'test-codestral-key',

  // API Timeouts (in ms)
  REQUEST_TIMEOUT: 30000, // 30 seconds
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute

  // Logging
  LOG_LEVEL: rawConfig.LOG_LEVEL,

  // Feature flags
  ENABLE_METRICS: rawConfig.ENABLE_METRICS !== 'false',
  ENABLE_TRACING: rawConfig.ENABLE_TRACING !== 'false',
};

export type Config = typeof config;
