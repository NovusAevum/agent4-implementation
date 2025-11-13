import { FallbackLLM } from '../fallback';
import { LLMProvider } from '../providers/base';

// Mock all providers
jest.mock('../providers/huggingface');
jest.mock('../providers/mistral');
jest.mock('../providers/deepseek');
jest.mock('../providers/openrouter');
jest.mock('../providers/codestral');

describe('FallbackLLM Integration Tests', () => {
  let fallbackLLM: FallbackLLM;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variables
    process.env.HF_TOKEN = 'test-hf-token';
    process.env.MISTRAL_API_KEY = 'test-mistral-key';
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.FALLBACK_ORDER = 'huggingface,mistral,deepseek';
  });

  afterEach(() => {
    if (fallbackLLM) {
      fallbackLLM.destroy();
    }
  });

  describe('Provider Fallback', () => {
    it('should fallback to second provider when first fails', async () => {
      const mockProviders: Partial<LLMProvider>[] = [
        {
          generate: jest.fn().mockRejectedValue(new Error('Provider 1 failed')),
          checkHealth: jest.fn().mockResolvedValue(false),
        },
        {
          generate: jest.fn().mockResolvedValue('Success from provider 2'),
          checkHealth: jest.fn().mockResolvedValue(true),
        },
      ];

      fallbackLLM = new FallbackLLM();
      // Simulate initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Mock the providers array
      (fallbackLLM as any).providers = mockProviders.map((provider, index) => ({
        name: `provider${index}`,
        provider: provider as LLMProvider,
        priority: index,
        isHealthy: true,
        lastError: null,
        errorCount: 0,
        lastUsed: 0,
        totalRequests: 0,
        failedRequests: 0,
      }));
      (fallbackLLM as any).initialized = true;

      const result = await fallbackLLM.generate('Test prompt');

      expect(result).toBe('Success from provider 2');
      expect(mockProviders[0]!.generate).toHaveBeenCalled();
      expect(mockProviders[1]!.generate).toHaveBeenCalled();
    });

    it('should try all providers before failing', async () => {
      const mockProviders: Partial<LLMProvider>[] = [
        {
          generate: jest.fn().mockRejectedValue(new Error('Provider 1 failed')),
          checkHealth: jest.fn().mockResolvedValue(false),
        },
        {
          generate: jest.fn().mockRejectedValue(new Error('Provider 2 failed')),
          checkHealth: jest.fn().mockResolvedValue(false),
        },
        {
          generate: jest.fn().mockRejectedValue(new Error('Provider 3 failed')),
          checkHealth: jest.fn().mockResolvedValue(false),
        },
      ];

      fallbackLLM = new FallbackLLM();
      await new Promise((resolve) => setTimeout(resolve, 100));

      (fallbackLLM as any).providers = mockProviders.map((provider, index) => ({
        name: `provider${index}`,
        provider: provider as LLMProvider,
        priority: index,
        isHealthy: true,
        lastError: null,
        errorCount: 0,
        lastUsed: 0,
        totalRequests: 0,
        failedRequests: 0,
      }));
      (fallbackLLM as any).initialized = true;

      await expect(fallbackLLM.generate('Test')).rejects.toThrow();

      expect(mockProviders[0]!.generate).toHaveBeenCalled();
      expect(mockProviders[1]!.generate).toHaveBeenCalled();
      expect(mockProviders[2]!.generate).toHaveBeenCalled();
    });

    it('should mark provider as unhealthy after failure', async () => {
      const mockProvider: Partial<LLMProvider> = {
        generate: jest.fn().mockRejectedValue(new Error('Provider failed')),
        checkHealth: jest.fn().mockResolvedValue(true),
      };

      fallbackLLM = new FallbackLLM();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const providerInfo = {
        name: 'test-provider',
        provider: mockProvider as LLMProvider,
        priority: 0,
        isHealthy: true,
        lastError: null,
        errorCount: 0,
        lastUsed: 0,
        totalRequests: 0,
        failedRequests: 0,
      };

      (fallbackLLM as any).providers = [providerInfo];
      (fallbackLLM as any).initialized = true;

      await expect(fallbackLLM.generate('Test')).rejects.toThrow();

      expect(providerInfo.isHealthy).toBe(false);
      expect(providerInfo.errorCount).toBe(1);
      expect(providerInfo.failedRequests).toBe(1);
    });

    it('should track request statistics correctly', async () => {
      const mockProvider: Partial<LLMProvider> = {
        generate: jest.fn().mockResolvedValue('Success'),
        checkHealth: jest.fn().mockResolvedValue(true),
      };

      fallbackLLM = new FallbackLLM();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const providerInfo = {
        name: 'test-provider',
        provider: mockProvider as LLMProvider,
        priority: 0,
        isHealthy: true,
        lastError: null,
        errorCount: 0,
        lastUsed: 0,
        totalRequests: 0,
        failedRequests: 0,
      };

      (fallbackLLM as any).providers = [providerInfo];
      (fallbackLLM as any).initialized = true;

      await fallbackLLM.generate('Test');

      expect(providerInfo.totalRequests).toBe(1);
      expect(providerInfo.failedRequests).toBe(0);
      expect(providerInfo.lastUsed).toBeGreaterThan(0);
    });
  });

  describe('Health Check System', () => {
    it('should run health checks on all providers', async () => {
      const mockProviders: Partial<LLMProvider>[] = [
        {
          generate: jest.fn().mockResolvedValue('Response 1'),
          checkHealth: jest.fn().mockResolvedValue(true),
        },
        {
          generate: jest.fn().mockResolvedValue('Response 2'),
          checkHealth: jest.fn().mockResolvedValue(false),
        },
      ];

      fallbackLLM = new FallbackLLM();
      await new Promise((resolve) => setTimeout(resolve, 100));

      (fallbackLLM as any).providers = mockProviders.map((provider, index) => ({
        name: `provider${index}`,
        provider: provider as LLMProvider,
        priority: index,
        isHealthy: false,
        lastError: null,
        errorCount: 0,
        lastUsed: 0,
        totalRequests: 0,
        failedRequests: 0,
      }));
      (fallbackLLM as any).initialized = true;

      await (fallbackLLM as any).checkAllProvidersHealth();

      expect((fallbackLLM as any).providers[0].isHealthy).toBe(true);
      expect((fallbackLLM as any).providers[1].isHealthy).toBe(false);
    });

    it('should update lastError on health check failure', async () => {
      const mockError = new Error('Health check failed');
      const mockProvider: Partial<LLMProvider> = {
        generate: jest.fn(),
        checkHealth: jest.fn().mockRejectedValue(mockError),
      };

      fallbackLLM = new FallbackLLM();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const providerInfo = {
        name: 'test-provider',
        provider: mockProvider as LLMProvider,
        priority: 0,
        isHealthy: true,
        lastError: null,
        errorCount: 0,
        lastUsed: 0,
        totalRequests: 0,
        failedRequests: 0,
      };

      (fallbackLLM as any).providers = [providerInfo];
      (fallbackLLM as any).initialized = true;

      await (fallbackLLM as any).checkAllProvidersHealth();

      expect(providerInfo.isHealthy).toBe(false);
      expect(providerInfo.lastError).toBeTruthy();
    });
  });

  describe('Memory Management', () => {
    it('should clean up health check interval on destroy', () => {
      fallbackLLM = new FallbackLLM();

      fallbackLLM.destroy();

      // Note: This may not always trigger if initialization hasn't completed
      // but the destroy method should handle null intervals gracefully
      expect(() => fallbackLLM.destroy()).not.toThrow();
    });
  });

  describe('getActiveProviderName', () => {
    it('should return name of first healthy provider', () => {
      fallbackLLM = new FallbackLLM();

      (fallbackLLM as any).providers = [
        { name: 'provider1', isHealthy: false },
        { name: 'provider2', isHealthy: true },
        { name: 'provider3', isHealthy: true },
      ];
      (fallbackLLM as any).initialized = true;

      const result = fallbackLLM.getActiveProviderName();

      expect(result).toBe('provider2');
    });

    it('should return first provider name if none are healthy', () => {
      fallbackLLM = new FallbackLLM();

      (fallbackLLM as any).providers = [
        { name: 'provider1', isHealthy: false },
        { name: 'provider2', isHealthy: false },
      ];
      (fallbackLLM as any).initialized = true;

      const result = fallbackLLM.getActiveProviderName();

      expect(result).toBe('provider1');
    });

    it('should return "none" if no providers exist', () => {
      fallbackLLM = new FallbackLLM();

      (fallbackLLM as any).providers = [];
      (fallbackLLM as any).initialized = true;

      const result = fallbackLLM.getActiveProviderName();

      expect(result).toBe('none');
    });
  });
});
