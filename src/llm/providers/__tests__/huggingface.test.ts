import { HuggingFaceProvider } from '../huggingface';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HuggingFaceProvider', () => {
  let provider: HuggingFaceProvider;
  const mockApiKey = 'test-api-key';
  const mockModel = 'test-model';
  const mockApiUrl = 'https://api.test.huggingface.co/models';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new HuggingFaceProvider(mockApiKey, mockModel, mockApiUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should make a request to the Hugging Face API with correct parameters', async () => {
      const mockResponse = { generated_text: 'Test response' };
      mockedAxios.mockResolvedValueOnce({
        data: [mockResponse],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as any);

      const prompt = 'Test prompt';
      const options = { max_tokens: 50 };

      const result = await provider.generate(prompt, options);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: `${mockApiUrl}/${mockModel}`,
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toBe('Test response');
    });

    it('should throw an error if the API returns an error', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
        message: 'Request failed with status code 500',
      };
      mockedAxios.mockRejectedValueOnce(errorResponse);

      const prompt = 'Test prompt';

      await expect(provider.generate(prompt)).rejects.toThrow(
        'HuggingFace API error'
      );
    });

    it('should handle retry logic for retryable errors', async () => {
      const errorResponse = {
        response: {
          status: 503,
          data: { error: 'Service unavailable' },
        },
        message: 'Request failed with status code 503',
      };
      const mockResponse = { generated_text: 'Test response after retry' };

      mockedAxios
        .mockRejectedValueOnce(errorResponse)
        .mockResolvedValueOnce({
          data: [mockResponse],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as any);

      const prompt = 'Test prompt';
      const result = await provider.generate(prompt);

      expect(mockedAxios).toHaveBeenCalledTimes(2);
      expect(result).toBe('Test response after retry');
    });
  });

  describe('checkHealth', () => {
    it('should return true if the API is healthy', async () => {
      mockedAxios.post = jest.fn().mockResolvedValueOnce({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as any);

      const result = await provider.checkHealth();

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${mockApiUrl}/${mockModel}`,
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it('should return false if the API is unhealthy', async () => {
      mockedAxios.post = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.checkHealth();

      expect(result).toBe(false);
    });
  });
});
