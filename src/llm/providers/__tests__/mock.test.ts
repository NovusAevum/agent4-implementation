import { MockProvider } from '../mock';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    // Create a new instance before each test
    provider = new MockProvider();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should always return true', async () => {
      const isHealthy = await provider.checkHealth();
      expect(isHealthy).toBe(true);
    });
  });

  describe('generate', () => {
    it('should return a mock response', async () => {
      const prompt = 'Test prompt';
      const response = await provider.generate(prompt);
      
      expect(typeof response).toBe('string');
      expect(response).toContain(prompt);
    });

    it('should throw an error for empty prompt', async () => {
      await expect(provider.generate(''))
        .rejects
        .toThrow('Prompt cannot be empty');
    });
  });
});
