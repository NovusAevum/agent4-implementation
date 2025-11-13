import { LLMProvider } from './providers/base';
import { HuggingFaceProvider } from './providers/huggingface';
import { MistralProvider } from './providers/mistral';
import { DeepSeekProvider } from './providers/deepseek';
import { OpenRouterProvider } from './providers/openrouter';
import { CodestralProvider } from './providers/codestral';
import { config } from '../config/index';
import { logger, ErrorHandler } from '../utils';

// Constants
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Provider configurations with all available models
const PROVIDER_CONFIG = {
  huggingface: {
    model: 'mistralai/Mistral-7B-Instruct-v0.1',
    apiUrl: 'https://api-inference.huggingface.co/models',
    envVar: 'HF_TOKEN',
  },
  mistral: {
    model: 'mistral-small-latest',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    envVar: 'MISTRAL_API_KEY',
  },
  deepseek: {
    model: 'deepseek-coder-33b-instruct',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    envVar: 'DEEPSEEK_API_KEY',
  },
  openrouter: {
    model: 'mistralai/mistral-7b-instruct',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    envVar: 'OPENROUTER_API_KEY',
    headers: {
      'HTTP-Referer': 'https://github.com/your-username/agent4-implementation',
      'X-Title': 'Agent4 Implementation',
    },
  },
  codestral: {
    model: 'codestral-latest',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    envVar: 'MISTRAL_API_KEY', // Reusing Mistral's API key as per their documentation
  },
} as const;

type ProviderName = keyof typeof PROVIDER_CONFIG;

interface ProviderInfo {
  name: ProviderName;
  provider: LLMProvider;
  priority: number;
  isHealthy: boolean;
  lastError: Error | null;
  errorCount: number;
  lastUsed: number;
  totalRequests: number;
  failedRequests: number;
}

export class FallbackLLM {
  private providers: ProviderInfo[] = [];
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private lastError: Error | null = null;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initialize().catch((error) => {
      const formattedError = ErrorHandler.format(error);
      logger.error('Failed to initialize FallbackLLM', formattedError);
      this.lastError = formattedError;
    });
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeProviders()
        .then(() => {
          this.initialized = true;
          this.startHealthChecks();
        })
        .catch((error) => {
          logger.error('Failed to initialize providers', ErrorHandler.format(error));
          throw error;
        });
    }

    await this.initializationPromise;
  }

  private startHealthChecks(): void {
    // Run health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllProvidersHealth();
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  /**
   * Stop health checks and clean up resources
   * Call this before destroying the FallbackLLM instance to prevent memory leaks
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private async checkAllProvidersHealth(): Promise<void> {
    await Promise.all(
      this.providers.map(async (providerInfo) => {
        try {
          const isHealthy = await providerInfo.provider.checkHealth();
          providerInfo.isHealthy = isHealthy;
          if (isHealthy) {
            providerInfo.lastError = null;
            logger.debug('Provider health check passed', { provider: providerInfo.name });
          }
        } catch (error) {
          providerInfo.isHealthy = false;
          providerInfo.lastError = ErrorHandler.format(error);
          logger.warn('Provider health check failed', {
            provider: providerInfo.name,
            error: ErrorHandler.getMessage(error),
          });
        }
      })
    );
  }

  private async initializeProviders(): Promise<void> {
    try {
      // Get the list of providers in order of preference
      const providerOrder = (
        Array.isArray(config.FALLBACK_ORDER)
          ? config.FALLBACK_ORDER
          : String(config.FALLBACK_ORDER)
              .split(',')
              .map((p: string) => p.trim().toLowerCase() as ProviderName)
      ).filter((name): name is ProviderName => name in PROVIDER_CONFIG);

      // If no valid providers are specified, use a default fallback order
      const effectiveProviderOrder = providerOrder.length > 0 ? providerOrder : ['huggingface'];

      // Initialize providers with their respective configurations
      const providers = await Promise.all(
        effectiveProviderOrder.map(async (providerName, index) => {
          try {
            const providerConfig = PROVIDER_CONFIG[providerName as keyof typeof PROVIDER_CONFIG];
            const apiKey = config[providerConfig.envVar as keyof typeof config] as string;

            // In test/development, allow test keys; in production, require real keys
            if (!apiKey) {
              logger.warn('No API key found for provider', { provider: providerName });
              return null;
            }
            if (config.NODE_ENV === 'production' && apiKey.startsWith('test-')) {
              logger.warn('Test API key not allowed in production', { provider: providerName });
              return null;
            }

            let provider: LLMProvider;

            switch (providerName) {
              case 'huggingface':
                const hfConfig = providerConfig as (typeof PROVIDER_CONFIG)['huggingface'];
                provider = new HuggingFaceProvider(apiKey, hfConfig.model, hfConfig.apiUrl);
                break;

              case 'mistral':
                const mistralConfig = providerConfig as (typeof PROVIDER_CONFIG)['mistral'];
                provider = new MistralProvider(apiKey, mistralConfig.model, mistralConfig.apiUrl);
                break;

              case 'deepseek':
                const deepseekConfig = providerConfig as (typeof PROVIDER_CONFIG)['deepseek'];
                provider = new DeepSeekProvider(
                  apiKey,
                  deepseekConfig.model,
                  deepseekConfig.apiUrl
                );
                break;

              case 'openrouter':
                const openrouterConfig = providerConfig as (typeof PROVIDER_CONFIG)['openrouter'];
                provider = new OpenRouterProvider(
                  apiKey,
                  openrouterConfig.model,
                  openrouterConfig.apiUrl
                );
                break;

              case 'codestral':
                const codestralConfig = providerConfig as (typeof PROVIDER_CONFIG)['codestral'];
                provider = new CodestralProvider(
                  apiKey,
                  codestralConfig.model,
                  codestralConfig.apiUrl
                );
                break;

              default:
                logger.warn('Provider not yet implemented', { provider: providerName });
                return null;
            }

            const isHealthy = await provider.checkHealth().catch(() => false);

            return {
              name: providerName,
              provider,
              priority: index,
              isHealthy,
              lastError: null,
              errorCount: 0,
              lastUsed: 0,
              totalRequests: 0,
              failedRequests: 0,
            };
          } catch (error) {
            logger.error('Failed to initialize provider', ErrorHandler.format(error), {
              provider: providerName,
            });
            return null;
          }
        })
      );

      // Filter out any null providers (failed to initialize)
      this.providers = providers.filter((p): p is NonNullable<typeof p> => p !== null);

      if (this.providers.length === 0) {
        throw new Error('No valid LLM providers could be initialized');
      }

      logger.info('LLM providers initialized', {
        count: this.providers.length,
        providers: this.providers.map((p) => ({
          name: p.name,
          healthy: p.isHealthy,
        })),
      });
    } catch (error) {
      logger.error('Error initializing providers', ErrorHandler.format(error));
      throw new Error(`Failed to initialize providers: ${ErrorHandler.getMessage(error)}`);
    }
  }

  async generate(prompt: string, options: Record<string, unknown> = {}): Promise<string> {
    await this.initialize();

    if (this.providers.length === 0) {
      throw new Error('No LLM providers available');
    }

    let lastError: Error | null = null;

    // Try each provider in order
    for (const providerInfo of this.providers) {
      try {
        providerInfo.lastUsed = Date.now();

        const result = await providerInfo.provider.generate(prompt, options);

        // Success - mark provider as healthy and update statistics
        providerInfo.isHealthy = true;
        providerInfo.lastError = null;
        providerInfo.totalRequests++;
        this.lastError = null; // Clear stale errors on success

        return result;
      } catch (error) {
        const formattedError = ErrorHandler.format(error);
        logger.error('Provider generate failed', formattedError, {
          provider: providerInfo.name,
          errorCount: providerInfo.errorCount + 1,
        });

        // Update failure statistics
        providerInfo.failedRequests++;
        providerInfo.errorCount++;
        providerInfo.isHealthy = false;
        providerInfo.lastError = formattedError;

        lastError = formattedError;
      }
    }

    this.lastError = lastError;
    throw lastError || new Error('All providers failed to generate a response');
  }

  getActiveProviderName(): string {
    // Return the first healthy provider, or the first provider if none are healthy
    const healthyProvider = this.providers.find((p) => p.isHealthy);
    return healthyProvider?.name || this.providers[0]?.name || 'none';
  }

  getActiveProvider(): LLMProvider | null {
    return this.providers[0]?.provider || null;
  }
  getLastError(): Error | null {
    return this.lastError;
  }
}
