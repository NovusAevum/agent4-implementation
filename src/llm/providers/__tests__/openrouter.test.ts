import { OpenRouterProvider } from '../openrouter';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider;
  const mockApiKey = 'test-openrouter-key';
  const mockModel = 'mistralai/mistral-7b-instruct';
  const mockApiUrl = 'https://test.openrouter.ai/api/v1/chat/completions';
  const mockSiteUrl = 'https://test-app.com';
  const mockAppName = 'Test App';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenRouterProvider(mockApiKey, mockModel, mockApiUrl, mockSiteUrl, mockAppName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with all parameters', () => {
      expect(provider).toBeInstanceOf(OpenRouterProvider);
    });

    it('should throw error if API key is empty', () => {
      expect(
        () => new OpenRouterProvider('', mockModel, mockApiUrl, mockSiteUrl, mockAppName)
      ).toThrow('API key is required');
    });
  });

  describe('generate', () => {
    it('should include required OpenRouter headers', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await provider.generate('Test prompt');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': mockSiteUrl,
            'X-Title': mockAppName,
          }),
        })
      );
    });

    it('should generate response successfully', async () => {
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

      const result = await provider.generate('Hello');

      expect(result).toBe('Test response');
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(provider.generate('Test')).rejects.toThrow('OpenRouter API');
    });

    it('should support custom options', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await provider.generate('Test', { max_tokens: 100, temperature: 0.5 });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          max_tokens: 100,
          temperature: 0.5,
        }),
        expect.any(Object)
      );
    });
  });

  describe('checkHealth', () => {
    it('should return true when API is healthy', async () => {
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

    it('should return false when API is unhealthy', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await provider.checkHealth();

      expect(result).toBe(false);
    });
  });
});
