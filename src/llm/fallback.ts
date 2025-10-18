import { LLMProvider } from './providers/base';
import { MockProvider } from './providers/mock';
import { HuggingFaceProvider } from './providers/huggingface';
import { MistralProvider } from './providers/mistral';
import { DeepSeekProvider } from './providers/deepseek';
import { OpenRouterProvider } from './providers/openrouter';
import { CodestralProvider } from './providers/codestral';
import { config } from '../config';

// Provider configurations with all available models
const PROVIDER_CONFIG = {
  huggingface: {
    model: 'mistralai/Mistral-7B-Instruct-v0.1',
    apiUrl: 'https://api-inference.huggingface.co/models',
    envVar: 'HF_TOKEN',
  },
  alibaba_qwen: {
    model: 'Qwen/Qwen1.5-72B-Chat',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    envVar: 'ALIBABA_QWEN_API_KEY',
  },
  kimi: {
    model: 'kimi-2-8b',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    envVar: 'KIMI_API_KEY',
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

type ProviderName = keyof typeof PROVIDER_CONFIG | 'mock';

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
  // @ts-ignore - Used for health checking interval management
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize().catch((error) => {
      console.error('Failed to initialize FallbackLLM:', error);
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
          console.error('Failed to initialize providers:', error);
          throw error;
        });
    }

    await this.initializationPromise;
  }

  private startHealthChecks(): void {
    // Run health check every 5 minutes
    this.healthCheckInterval = setInterval(
      async () => {
        await this.checkAllProvidersHealth();
      },
      5 * 60 * 1000
    );
  }

  private async checkAllProvidersHealth(): Promise<void> {
    await Promise.all(
      this.providers.map(async (providerInfo) => {
        try {
          const isHealthy = await providerInfo.provider.checkHealth();
          providerInfo.isHealthy = isHealthy;
          if (isHealthy) {
            providerInfo.lastError = null;
          }
        } catch (error) {
          providerInfo.isHealthy = false;
          providerInfo.lastError = error instanceof Error ? error : new Error(String(error));
        }
      })
    );
  }

  // Remove unused method
  // private stopHealthChecks(): void {
  //   if (this.healthCheckInterval) {
  //     clearInterval(this.healthCheckInterval);
  //     this.healthCheckInterval = null;
  //   }
  // }

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
      const effectiveProviderOrder =
        providerOrder.length > 0 ? providerOrder : ['huggingface', 'mock'];

      // Initialize providers with their respective configurations
      const providers = await Promise.all(
        effectiveProviderOrder.map(async (providerName, index) => {
          try {
            const providerConfig = PROVIDER_CONFIG[providerName as keyof typeof PROVIDER_CONFIG];
            const apiKey = config[providerConfig.envVar as keyof typeof config] as string;

            if (!apiKey && providerName !== 'mock') {
              console.warn(`No API key found for provider: ${providerName}`);
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

              case 'mock':
                provider = new MockProvider();
                break;

              default:
                console.warn(`Provider ${providerName} not yet implemented`);
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
            console.error(`Failed to initialize provider ${providerName}:`, error);
            return null;
          }
        })
      );

      // Filter out any null providers (failed to initialize)
      this.providers = providers.filter((p): p is NonNullable<typeof p> => p !== null);

      if (this.providers.length === 0) {
        throw new Error('No valid LLM providers could be initialized');
      }

      console.log(
        `Initialized ${this.providers.length} LLM provider(s):`,
        this.providers.map((p) => `${p.name} (${p.isHealthy ? 'healthy' : 'unhealthy'})`).join(', ')
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error initializing providers:', errorMessage);
      throw new Error(`Failed to initialize providers: ${errorMessage}`);
    }
  }

  async generate(prompt: string, options: Record<string, unknown> = {}): Promise<string> {
    await this.initialize();

    if (this.providers.length === 0) {
      throw new Error('No LLM providers available');
    }

    let lastError: Error | null = null;

    // Try each provider in order
    for (const { name, provider } of this.providers) {
      try {
        const result = await provider.generate(prompt, options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error with ${name} provider:`, errorMessage);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError || new Error('All providers failed to generate a response');
  }

  getActiveProviderName(): string {
    return this.providers[0]?.name || 'none';
  }

  getActiveProvider(): LLMProvider | null {
    return this.providers[0]?.provider || null;
  }
  getLastError(): Error | null {
    return this.lastError;
  }
}
