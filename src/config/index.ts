import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // API Keys (all optional with test defaults)
  HF_TOKEN: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  CODESTRAL_API_KEY: z.string().optional(),

  // Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DEFAULT_LLM_PROVIDER: z.string().default('huggingface'),
  FALLBACK_ORDER: z.string().default('huggingface,mistral,deepseek,openrouter,codestral'),
  LOG_LEVEL: z.string().default('info'),
  ENABLE_METRICS: z.string().default('true'),
  ENABLE_TRACING: z.string().default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  CORS_ORIGIN: z.string().default('*'),
});

const rawConfig = envSchema.parse({
  ...process.env,
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEFAULT_LLM_PROVIDER: process.env.DEFAULT_LLM_PROVIDER || 'huggingface',
  FALLBACK_ORDER: process.env.FALLBACK_ORDER || 'huggingface,mistral,deepseek,openrouter,codestral',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_METRICS: process.env.ENABLE_METRICS || 'true',
  ENABLE_TRACING: process.env.ENABLE_TRACING || 'true',
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
});

// Transform and enhance the config with proper types and defaults
export const config = {
  // Server configuration
  NODE_ENV: rawConfig.NODE_ENV,
  PORT: parseInt(rawConfig.PORT, 10),

  // LLM Providers
  DEFAULT_LLM_PROVIDER: rawConfig.DEFAULT_LLM_PROVIDER,
  FALLBACK_ORDER: rawConfig.FALLBACK_ORDER.split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0),

  // API Keys (test defaults only for development/test environments)
  HF_TOKEN: rawConfig.HF_TOKEN || (rawConfig.NODE_ENV === 'production' ? '' : 'test-hf-token'),
  MISTRAL_API_KEY:
    rawConfig.MISTRAL_API_KEY || (rawConfig.NODE_ENV === 'production' ? '' : 'test-mistral-key'),
  DEEPSEEK_API_KEY:
    rawConfig.DEEPSEEK_API_KEY || (rawConfig.NODE_ENV === 'production' ? '' : 'test-deepseek-key'),
  OPENROUTER_API_KEY:
    rawConfig.OPENROUTER_API_KEY ||
    (rawConfig.NODE_ENV === 'production' ? '' : 'test-openrouter-key'),
  CODESTRAL_API_KEY:
    rawConfig.CODESTRAL_API_KEY ||
    (rawConfig.NODE_ENV === 'production' ? '' : 'test-codestral-key'),

  // API Timeouts (in ms)
  REQUEST_TIMEOUT: 30000, // 30 seconds
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute

  // Logging
  LOG_LEVEL: rawConfig.LOG_LEVEL,

  // Feature flags
  ENABLE_METRICS: rawConfig.ENABLE_METRICS !== 'false',
  ENABLE_TRACING: rawConfig.ENABLE_TRACING !== 'false',

  // Rate Limiting & Security (with validation)
  RATE_LIMIT_WINDOW_MS: (() => {
    const value = parseInt(rawConfig.RATE_LIMIT_WINDOW_MS, 10);
    if (isNaN(value) || value <= 0) {
      throw new Error(
        `Invalid RATE_LIMIT_WINDOW_MS: "${rawConfig.RATE_LIMIT_WINDOW_MS}". Must be a positive integer (in milliseconds)`
      );
    }
    if (value < 1000) {
      throw new Error(
        `RATE_LIMIT_WINDOW_MS too small: ${value}ms. Must be at least 1000ms (1 second)`
      );
    }
    return value;
  })(),
  RATE_LIMIT_MAX_REQUESTS: (() => {
    const value = parseInt(rawConfig.RATE_LIMIT_MAX_REQUESTS, 10);
    if (isNaN(value) || value <= 0) {
      throw new Error(
        `Invalid RATE_LIMIT_MAX_REQUESTS: "${rawConfig.RATE_LIMIT_MAX_REQUESTS}". Must be a positive integer`
      );
    }
    if (value > 10000) {
      throw new Error(
        `RATE_LIMIT_MAX_REQUESTS too high: ${value}. Maximum recommended value is 10000 to prevent abuse`
      );
    }
    return value;
  })(),
  CORS_ORIGIN: rawConfig.CORS_ORIGIN,
};

export type Config = typeof config;
