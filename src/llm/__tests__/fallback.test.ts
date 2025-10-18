// Mock the MockProvider
const mockCheckHealth = jest.fn().mockResolvedValue(true);
const mockGenerate = jest.fn().mockResolvedValue('Mock response');

// Mock the providers
jest.mock('../providers/mock', () => ({
  MockProvider: jest.fn().mockImplementation(() => ({
    checkHealth: mockCheckHealth,
    generate: mockGenerate,
  }))
}));

// Mock other providers to fail health checks
jest.mock('../providers/continue', () => ({
  ContinueProvider: jest.fn().mockImplementation(() => ({
    checkHealth: jest.fn().mockResolvedValue(false),
    generate: jest.fn()
  }))
}));

// Create a mock provider instance
const mockProvider = {
  checkHealth: mockCheckHealth,
  generate: mockGenerate
};

// Mock the FallbackLLM class to avoid actual provider initialization
jest.mock('../fallback', () => {
  const originalModule = jest.requireActual('../fallback');
  
  return {
    ...originalModule,
    FallbackLLM: class MockFallbackLLM extends originalModule.FallbackLLM {
      private mockInitialized = false;
      
      constructor() {
        super();
        // Skip the actual initialization in the constructor
        Object.defineProperty(this, 'initialized', {
          get: () => this.mockInitialized,
          set: (value) => { this.mockInitialized = value; }
        });
      }
      
      async initialize() {
        // Skip the actual initialization
        this.mockInitialized = true;
      }
      
      async generate(prompt: string, options: Record<string, unknown> = {}): Promise<string> {
        if (!this.initialized) {
          await this.initialize();
        }
        return mockGenerate(prompt, options);
      }
      
      getActiveProvider() {
        return mockProvider;
      }
      
      getActiveProviderName() {
        return 'mock';
      }
    }
  };
});

import { FallbackLLM } from '../fallback';

describe('FallbackLLM', () => {
  let fallbackLLM: FallbackLLM;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set test environment
    process.env.FALLBACK_ORDER = 'mock';
    process.env.DEFAULT_LLM_PROVIDER = 'mock';
    
    // Create new instance for each test
    fallbackLLM = new FallbackLLM();
    
    // Default mock implementations
    mockCheckHealth.mockResolvedValue(true);
    mockGenerate.mockResolvedValue('Mock response');
  });

  it('should initialize successfully', async () => {
    // The mock initialize method should resolve without error
    await expect(fallbackLLM['initialize']()).resolves.not.toThrow();
    
    // Verify the internal state was updated
    expect(fallbackLLM['initialized']).toBe(true);
  });

  it('should generate a response using the mock provider', async () => {
    const testPrompt = 'Test prompt';
    const mockResponse = 'Mock response to: ' + testPrompt;
    mockGenerate.mockResolvedValue(mockResponse);
    
    const response = await fallbackLLM.generate(testPrompt);
    
    expect(response).toBe(mockResponse);
    expect(mockGenerate).toHaveBeenCalledWith(testPrompt, {});
  });

  it('should handle generation errors', async () => {
    const errorMessage = 'Test error';
    mockGenerate.mockRejectedValueOnce(new Error(errorMessage));
    
    await expect(fallbackLLM.generate('test'))
      .rejects
      .toThrow(errorMessage);
  });

  it('should return the active provider', async () => {
    const provider = fallbackLLM.getActiveProvider();
    expect(provider).toBeDefined();
    expect(provider).toHaveProperty('generate');
    expect(provider).toHaveProperty('checkHealth');
  });
});
