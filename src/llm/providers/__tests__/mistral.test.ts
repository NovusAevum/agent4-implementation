import { MistralProvider } from '../mistral';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MistralProvider', () => {
  let provider: MistralProvider;
  const mockApiKey = 'test-mistral-key';
  const mockModel = 'mistral-small-latest';
  const mockApiUrl = 'https://api.test.mistral.ai/v1/chat/completions';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new MistralProvider(mockApiKey, mockModel, mockApiUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      expect(provider).toBeInstanceOf(MistralProvider);
    });

    it('should throw error if API key is empty', () => {
      expect(() => new MistralProvider('', mockModel, mockApiUrl)).toThrow('API key is required');
    });

    it('should throw error if API key is whitespace', () => {
      expect(() => new MistralProvider('   ', mockModel, mockApiUrl)).toThrow(
        'API key is required'
      );
    });
  });

  describe('generate', () => {
    it('should make a request to the Mistral API with correct parameters', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Test response' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const prompt = 'Test prompt';
      const options = { max_tokens: 100, temperature: 0.8 };

      const result = await provider.generate(prompt, options);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          model: mockModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.8,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toBe('Test response');
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
        message: 'Request failed with status code 500',
      };
      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      const prompt = 'Test prompt';

      await expect(provider.generate(prompt)).rejects.toThrow('Mistral API');
    });

    it('should use default options when none provided', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Test' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await provider.generate('Test');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 1.0,
        }),
        expect.any(Object)
      );
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: '' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await provider.generate('Test');

      expect(result).toBe('');
    });
  });

  describe('checkHealth', () => {
    it('should return true if API is healthy', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'OK' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await provider.checkHealth();

      expect(result).toBe(true);
    });

    it('should return false if API is unhealthy', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.checkHealth();

      expect(result).toBe(false);
    });
  });
});
