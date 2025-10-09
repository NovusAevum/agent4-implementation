import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // API Keys
  CONTINUE_API_KEY: z.string().min(1, "Continue API key is required"),
  ALIBABA_QWEN_API_KEY: z.string().min(1, "Alibaba Qwen API key is required"),
  KIMI_API_KEY: z.string().min(1, "Kimi API key is required"),
  CODECOPILOT_KEY: z.string().min(1, "CodeCopilot key is required"),
  HF_TOKEN: z.string().min(1, "Hugging Face token is required"),
  
  // Configuration
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().default('3000'),
  DEFAULT_LLM_PROVIDER: z.string().default('continue'),
  FALLBACK_ORDER: z.string().default('continue,alibaba,kimi,codestral'),
});

export const config = envSchema.parse({
  ...process.env,
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
});

export type Config = z.infer<typeof envSchema>;
