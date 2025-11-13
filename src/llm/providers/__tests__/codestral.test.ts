import { CodestralProvider } from '../codestral';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CodestralProvider', () => {
  let provider: CodestralProvider;
  const mockApiKey = 'test-codestral-key';
  const mockModel = 'codestral-latest';
  const mockApiUrl = 'https://api.test.mistral.ai/v1/chat/completions';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new CodestralProvider(mockApiKey, mockModel, mockApiUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      expect(provider).toBeInstanceOf(CodestralProvider);
    });

    it('should throw error if API key is missing', () => {
      expect(() => new CodestralProvider('', mockModel, mockApiUrl)).toThrow('API key is required');
    });
  });

  describe('generate', () => {
    it('should use 2048 tokens by default for code generation', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'const x = 1;' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await provider.generate('Write code');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          model: mockModel,
          max_tokens: 2048,
        }),
        expect.any(Object)
      );
    });

    it('should generate code successfully', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'function test() {}' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await provider.generate('Create a function');

      expect(result).toBe('function test() {}');
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(provider.generate('Test')).rejects.toThrow('Codestral API');
    });

    it('should support custom temperature', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Code' } }],
      };
      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await provider.generate('Test', { temperature: 0.2 });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          temperature: 0.2,
        }),
        expect.any(Object)
      );
    });
  });

  describe('checkHealth', () => {
    it('should return true when healthy', async () => {
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

    it('should return false on failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await provider.checkHealth();

      expect(result).toBe(false);
    });
  });
});
