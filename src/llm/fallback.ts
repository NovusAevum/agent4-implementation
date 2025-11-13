import { LLMProvider } from './providers/base';
import { HuggingFaceProvider } from './providers/huggingface';
import { MistralProvider } from './providers/mistral';
import { DeepSeekProvider } from './providers/deepseek';
import { OpenRouterProvider } from './providers/openrouter';
import { CodestralProvider } from './providers/codestral';
import { config } from '../config/index';
import { logger, ErrorHandler, llmCache } from '../utils';

// Constants
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const PROVIDER_TIMEOUT_MS = 30000; // 30 seconds timeout per provider
const MAX_RETRY_ATTEMPTS = 2; // Retry failed requests 2 times
const CIRCUIT_BREAKER_THRESHOLD = 5; // Open circuit after 5 consecutive failures
const CIRCUIT_BREAKER_RESET_MS = 60000; // Reset circuit breaker after 1 minute

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
      'HTTP-Referer': 'https://github.com/NovusAevum/agent4-implementation',
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
  circuitBreakerOpen: boolean;
  circuitBreakerOpenedAt: number | null;
  consecutiveFailures: number;
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
      // Ensure no health check interval is running if initialization failed
      this.destroy();
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
              circuitBreakerOpen: false,
              circuitBreakerOpenedAt: null,
              consecutiveFailures: 0,
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

  /**
   * Generate response with timeout protection
   * @private
   */
  private async generateWithTimeout(
    provider: LLMProvider,
    prompt: string,
    options: Record<string, unknown>,
    timeoutMs: number
  ): Promise<string> {
    return Promise.race([
      provider.generate(prompt, options),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Provider timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Check and reset circuit breaker if cooldown period elapsed
   * @private
   */
  private checkCircuitBreaker(providerInfo: ProviderInfo): boolean {
    if (!providerInfo.circuitBreakerOpen) return false;

    const now = Date.now();
    const timeSinceOpen = now - (providerInfo.circuitBreakerOpenedAt || 0);

    // Reset circuit breaker after cooldown period
    if (timeSinceOpen >= CIRCUIT_BREAKER_RESET_MS) {
      logger.info('Circuit breaker reset', { provider: providerInfo.name });
      providerInfo.circuitBreakerOpen = false;
      providerInfo.circuitBreakerOpenedAt = null;
      providerInfo.consecutiveFailures = 0;
      return false;
    }

    return true;
  }

  /**
   * Try provider with retry logic and exponential backoff
   * @private
   */
  private async tryProviderWithRetry(
    providerInfo: ProviderInfo,
    prompt: string,
    options: Record<string, unknown>
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Add exponential backoff delay for retries
        if (attempt > 0) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          logger.debug('Retrying with backoff', {
            provider: providerInfo.name,
            attempt,
            backoffMs,
          });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }

        const result = await this.generateWithTimeout(
          providerInfo.provider,
          prompt,
          options,
          PROVIDER_TIMEOUT_MS
        );

        return result;
      } catch (error) {
        lastError = ErrorHandler.format(error);
        logger.warn('Provider attempt failed', {
          provider: providerInfo.name,
          attempt: attempt + 1,
          maxAttempts: MAX_RETRY_ATTEMPTS + 1,
          error: ErrorHandler.getMessage(error),
        });

        // Don't retry if it's not a retryable error
        if (attempt < MAX_RETRY_ATTEMPTS && !ErrorHandler.isRetryable(error)) {
          logger.debug('Error not retryable, skipping further attempts', {
            provider: providerInfo.name,
          });
          break;
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  async generate(prompt: string, options: Record<string, unknown> = {}): Promise<string> {
    await this.initialize();

    if (this.providers.length === 0) {
      throw new Error('No LLM providers available. Check API keys and network connectivity.');
    }

    // Check cache first (unless explicitly disabled)
    const useCache = options.cache !== false;
    if (useCache) {
      const cached = llmCache.get(prompt, options);
      if (cached) {
        logger.debug('Returning cached response', { prompt: prompt.substring(0, 50) });
        return cached;
      }
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    // Try each provider in order
    for (const providerInfo of this.providers) {
      // Check circuit breaker
      if (this.checkCircuitBreaker(providerInfo)) {
        logger.debug('Circuit breaker open, skipping provider', {
          provider: providerInfo.name,
          openedAt: providerInfo.circuitBreakerOpenedAt,
        });
        continue;
      }

      try {
        providerInfo.lastUsed = Date.now();
        providerInfo.totalRequests++;

        const result = await this.tryProviderWithRetry(providerInfo, prompt, options);

        // Success - mark provider as healthy and update statistics
        providerInfo.isHealthy = true;
        providerInfo.lastError = null;
        providerInfo.consecutiveFailures = 0;
        this.lastError = null; // Clear stale errors on success

        const duration = Date.now() - startTime;
        logger.info('Provider generate succeeded', {
          provider: providerInfo.name,
          duration,
          cached: false,
        });

        // Cache the result (unless explicitly disabled)
        if (useCache) {
          llmCache.set(prompt, result, options);
        }

        return result;
      } catch (error) {
        const formattedError = ErrorHandler.format(error);
        logger.error('Provider generate failed after retries', formattedError, {
          provider: providerInfo.name,
          errorCount: providerInfo.errorCount + 1,
          consecutiveFailures: providerInfo.consecutiveFailures + 1,
        });

        // Update failure statistics
        providerInfo.failedRequests++;
        providerInfo.errorCount++;
        providerInfo.consecutiveFailures++;
        providerInfo.isHealthy = false;
        providerInfo.lastError = formattedError;

        // Open circuit breaker if threshold reached
        if (providerInfo.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
          providerInfo.circuitBreakerOpen = true;
          providerInfo.circuitBreakerOpenedAt = Date.now();
          logger.warn('Circuit breaker opened', {
            provider: providerInfo.name,
            consecutiveFailures: providerInfo.consecutiveFailures,
          });
        }

        lastError = formattedError;
      }
    }

    this.lastError = lastError;
    const errorMessage =
      lastError?.message ||
      'All LLM providers failed to generate a response. Check logs for details.';
    throw new Error(`FallbackLLM Error: ${errorMessage}`);
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
