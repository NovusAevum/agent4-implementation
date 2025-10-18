import { HuggingFaceProvider } from '../huggingface';

describe('HuggingFaceProvider', () => {
  let provider: HuggingFaceProvider;
  const mockApiKey = 'test-api-key';
  const mockModel = 'test-model';
  const mockApiUrl = 'https://api.test.huggingface.co/models';

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn() as jest.Mock;
    provider = new HuggingFaceProvider(mockApiKey, mockModel, mockApiUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should make a request to the Hugging Face API with correct parameters', async () => {
      const mockResponse = { generated_text: 'Test response' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockResponse],
      });

      const prompt = 'Test prompt';
      const options = { max_tokens: 50 };

      const result = await provider.generate(prompt, options);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/${mockModel}`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockApiKey}`,
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: options.max_tokens,
              temperature: 0.7,
              top_p: 0.9,
              return_full_text: false,
            },
          }),
        })
      );
      expect(result).toBe(mockResponse.generated_text);
    });

    it('should throw an error if the API returns an error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
        }),
      });

      await expect(provider.generate('test')).rejects.toThrow(
        'API request failed with status 500: Internal server error'
      );
    });
  });

  describe('checkHealth', () => {
    it('should return true if the API is healthy', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const isHealthy = await provider.checkHealth();
      expect(isHealthy).toBe(true);
    });

    it('should return false if the API is not healthy', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await provider.checkHealth();
      expect(isHealthy).toBe(false);
    });
  });
});
