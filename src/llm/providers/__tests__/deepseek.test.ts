import { DeepSeekProvider } from '../deepseek';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider;
  const mockApiKey = 'test-deepseek-key';
  const mockModel = 'deepseek-coder';
  const mockApiUrl = 'https://api.test.deepseek.com/v1/chat/completions';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new DeepSeekProvider(mockApiKey, mockModel, mockApiUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      expect(provider).toBeInstanceOf(DeepSeekProvider);
    });

    it('should throw error if API key is empty', () => {
      expect(() => new DeepSeekProvider('', mockModel, mockApiUrl)).toThrow('API key is required');
    });
  });

  describe('generate', () => {
    it('should make a request with correct DeepSeek-specific defaults', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Code response' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await provider.generate('Write a function');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          model: mockModel,
          max_tokens: 2048, // DeepSeek default for code generation
        }),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(provider.generate('Test')).rejects.toThrow('DeepSeek API');
    });

    it('should respect custom max_tokens option', async () => {
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

      await provider.generate('Test', { max_tokens: 500 });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          max_tokens: 500,
        }),
        expect.any(Object)
      );
    });
  });

  describe('checkHealth', () => {
    it('should return true with successful test generation', async () => {
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
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10,
        }),
        expect.any(Object)
      );
    });

    it('should return false on error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await provider.checkHealth();

      expect(result).toBe(false);
    });
  });
});
