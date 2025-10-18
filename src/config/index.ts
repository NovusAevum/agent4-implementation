import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // API Keys (all optional except for at least one)
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
  DEFAULT_LLM_PROVIDER: z.string().default('huggingface'),
  FALLBACK_ORDER: z.string().default('huggingface,mistral,deepseek,openrouter,codestral,mock'),
});

export const config = envSchema.parse({
  ...process.env,
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
});

export type Config = z.infer<typeof envSchema>;
