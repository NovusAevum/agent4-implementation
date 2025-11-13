import {
  ResponseParser,
  RequestBuilder,
  LLMResponse,
  HuggingFaceResponse,
  LLMOptions,
} from '../llm-types';

describe('ResponseParser', () => {
  describe('extractContent', () => {
    it('should extract content from valid LLM response', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello, world!',
            },
          },
        ],
      };

      expect(ResponseParser.extractContent(response)).toBe('Hello, world!');
    });

    it('should return empty string when choices is empty array', () => {
      const response: LLMResponse = {
        choices: [],
      };

      expect(ResponseParser.extractContent(response)).toBe('');
    });

    it('should return empty string when choices is undefined', () => {
      const response = {} as LLMResponse;

      expect(ResponseParser.extractContent(response)).toBe('');
    });

    it('should return empty string when message is undefined', () => {
      const response: LLMResponse = {
        choices: [
          {} as any,
        ],
      };

      expect(ResponseParser.extractContent(response)).toBe('');
    });

    it('should return empty string when content is undefined', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: undefined as any,
            },
          },
        ],
      };

      expect(ResponseParser.extractContent(response)).toBe('');
    });

    it('should handle response with multiple choices and extract first', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'First response',
            },
          },
          {
            message: {
              role: 'assistant',
              content: 'Second response',
            },
          },
        ],
      };

      expect(ResponseParser.extractContent(response)).toBe('First response');
    });

    it('should handle response with all optional fields', () => {
      const response: LLMResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Complete response',
            },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      expect(ResponseParser.extractContent(response)).toBe('Complete response');
    });
  });

  describe('extractHuggingFaceContent', () => {
    it('should extract content from single object response', () => {
      const response: HuggingFaceResponse = {
        generated_text: 'Generated content',
      };

      expect(ResponseParser.extractHuggingFaceContent(response)).toBe('Generated content');
    });

    it('should extract content from array response', () => {
      const response: HuggingFaceResponse[] = [
        {
          generated_text: 'First generated content',
        },
        {
          generated_text: 'Second generated content',
        },
      ];

      expect(ResponseParser.extractHuggingFaceContent(response)).toBe('First generated content');
    });

    it('should return empty string for empty array', () => {
      const response: HuggingFaceResponse[] = [];

      expect(ResponseParser.extractHuggingFaceContent(response)).toBe('');
    });

    it('should return empty string when generated_text is undefined in object', () => {
      const response: HuggingFaceResponse = {};

      expect(ResponseParser.extractHuggingFaceContent(response)).toBe('');
    });

    it('should return empty string when generated_text is undefined in array', () => {
      const response: HuggingFaceResponse[] = [{}];

      expect(ResponseParser.extractHuggingFaceContent(response)).toBe('');
    });

    it('should handle response with error field', () => {
      const response: HuggingFaceResponse = {
        error: 'Something went wrong',
      };

      expect(ResponseParser.extractHuggingFaceContent(response)).toBe('');
    });

    it('should handle response with additional fields', () => {
      const response: HuggingFaceResponse = {
        generated_text: 'Content',
        additional_field: 'value',
        another_field: 123,
      };

      expect(ResponseParser.extractHuggingFaceContent(response)).toBe('Content');
    });
  });

  describe('extractUsage', () => {
    it('should extract usage information from response with usage', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Test',
            },
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      const usage = ResponseParser.extractUsage(response);

      expect(usage).not.toBeNull();
      expect(usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should return null when usage is undefined', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Test',
            },
          },
        ],
      };

      expect(ResponseParser.extractUsage(response)).toBeNull();
    });

    it('should handle usage with zero tokens', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
            },
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };

      const usage = ResponseParser.extractUsage(response);

      expect(usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should handle large token counts', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Long content',
            },
          },
        ],
        usage: {
          prompt_tokens: 10000,
          completion_tokens: 50000,
          total_tokens: 60000,
        },
      };

      const usage = ResponseParser.extractUsage(response);

      expect(usage).toEqual({
        promptTokens: 10000,
        completionTokens: 50000,
        totalTokens: 60000,
      });
    });
  });

  describe('isValidResponse', () => {
    it('should validate correct LLM response', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Valid content',
            },
          },
        ],
      };

      expect(ResponseParser.isValidResponse(response)).toBe(true);
    });

    it('should reject null response', () => {
      expect(ResponseParser.isValidResponse(null)).toBe(false);
    });

    it('should reject undefined response', () => {
      expect(ResponseParser.isValidResponse(undefined)).toBe(false);
    });

    it('should reject non-object response', () => {
      expect(ResponseParser.isValidResponse('string')).toBe(false);
      expect(ResponseParser.isValidResponse(123)).toBe(false);
      expect(ResponseParser.isValidResponse(true)).toBe(false);
    });

    it('should reject response without choices', () => {
      const response = { model: 'test' };

      expect(ResponseParser.isValidResponse(response)).toBe(false);
    });

    it('should reject response with non-array choices', () => {
      const response = { choices: 'not-array' };

      expect(ResponseParser.isValidResponse(response)).toBe(false);
    });

    it('should reject response with empty choices array', () => {
      const response = { choices: [] };

      expect(ResponseParser.isValidResponse(response)).toBe(false);
    });

    it('should reject response without message in first choice', () => {
      const response = {
        choices: [
          {
            index: 0,
          },
        ],
      };

      expect(ResponseParser.isValidResponse(response)).toBe(false);
    });

    it('should reject response without content in message', () => {
      const response = {
        choices: [
          {
            message: {
              role: 'assistant',
            },
          },
        ],
      };

      expect(ResponseParser.isValidResponse(response)).toBe(false);
    });

    it('should reject response with non-string content', () => {
      const response = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 123,
            },
          },
        ],
      };

      expect(ResponseParser.isValidResponse(response)).toBe(false);
    });

    it('should accept response with empty string content', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
            },
          },
        ],
      };

      expect(ResponseParser.isValidResponse(response)).toBe(true);
    });

    it('should accept response with multiple choices', () => {
      const response: LLMResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'First',
            },
          },
          {
            message: {
              role: 'assistant',
              content: 'Second',
            },
          },
        ],
      };

      expect(ResponseParser.isValidResponse(response)).toBe(true);
    });

    it('should accept response with all optional fields', () => {
      const response: LLMResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Content',
            },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      expect(ResponseParser.isValidResponse(response)).toBe(true);
    });
  });

  describe('isValidHuggingFaceResponse', () => {
    it('should validate correct HuggingFace object response', () => {
      const response: HuggingFaceResponse = {
        generated_text: 'Generated content',
      };

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(true);
    });

    it('should validate correct HuggingFace array response', () => {
      const response: HuggingFaceResponse[] = [
        {
          generated_text: 'Generated content',
        },
      ];

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(true);
    });

    it('should reject null response', () => {
      expect(ResponseParser.isValidHuggingFaceResponse(null)).toBe(false);
    });

    it('should reject undefined response', () => {
      expect(ResponseParser.isValidHuggingFaceResponse(undefined)).toBe(false);
    });

    it('should reject object without generated_text', () => {
      const response = { error: 'Error message' };

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(false);
    });

    it('should reject object with non-string generated_text', () => {
      const response = { generated_text: 123 };

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(false);
    });

    it('should reject empty array', () => {
      const response: any[] = [];

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(false);
    });

    it('should reject array without generated_text in first element', () => {
      const response = [{ error: 'Error' }];

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(false);
    });

    it('should reject array with non-string generated_text', () => {
      const response = [{ generated_text: null }];

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(false);
    });

    it('should accept object with empty string generated_text', () => {
      const response: HuggingFaceResponse = {
        generated_text: '',
      };

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(true);
    });

    it('should accept array with empty string generated_text', () => {
      const response: HuggingFaceResponse[] = [
        {
          generated_text: '',
        },
      ];

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(true);
    });

    it('should accept response with additional fields', () => {
      const response: HuggingFaceResponse = {
        generated_text: 'Content',
        additional_field: 'value',
        another: 123,
      };

      expect(ResponseParser.isValidHuggingFaceResponse(response)).toBe(true);
    });

    it('should reject primitive types', () => {
      expect(ResponseParser.isValidHuggingFaceResponse('string')).toBe(false);
      expect(ResponseParser.isValidHuggingFaceResponse(123)).toBe(false);
      expect(ResponseParser.isValidHuggingFaceResponse(true)).toBe(false);
    });
  });
});

describe('RequestBuilder', () => {
  describe('buildChatRequest', () => {
    it('should build request with default options', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Hello, world!');

      expect(request).toEqual({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello, world!' }],
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 1.0,
      });
    });

    it('should build request with custom max_tokens', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        max_tokens: 2048,
      });

      expect(request).toMatchObject({
        max_tokens: 2048,
      });
    });

    it('should build request with custom temperature', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        temperature: 0.9,
      });

      expect(request).toMatchObject({
        temperature: 0.9,
      });
    });

    it('should build request with custom top_p', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        top_p: 0.8,
      });

      expect(request).toMatchObject({
        top_p: 0.8,
      });
    });

    it('should build request with all custom options', () => {
      const options: LLMOptions = {
        max_tokens: 2048,
        temperature: 0.9,
        top_p: 0.95,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
        stop: ['END'],
        n: 2,
      };

      const request = RequestBuilder.buildChatRequest('gpt-4', 'Complex prompt', options);

      expect(request).toEqual({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Complex prompt' }],
        max_tokens: 2048,
        temperature: 0.9,
        top_p: 0.95,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
        stop: ['END'],
        n: 2,
      });
    });

    it('should handle stop as string', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        stop: 'STOP',
      });

      expect(request).toMatchObject({
        stop: 'STOP',
      });
    });

    it('should handle stop as array', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        stop: ['STOP', 'END', 'DONE'],
      });

      expect(request).toMatchObject({
        stop: ['STOP', 'END', 'DONE'],
      });
    });

    it('should include logit_bias option', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        logit_bias: { '50256': -100 },
      });

      expect(request).toMatchObject({
        logit_bias: { '50256': -100 },
      });
    });

    it('should include user option', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        user: 'user-123',
      });

      expect(request).toMatchObject({
        user: 'user-123',
      });
    });

    it('should include stream option', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        stream: true,
      });

      expect(request).toMatchObject({
        stream: true,
      });
    });

    it('should handle provider-specific options', () => {
      const request = RequestBuilder.buildChatRequest('mistral-large', 'Test', {
        custom_field: 'custom_value',
        another_option: 123,
      } as LLMOptions);

      expect(request).toMatchObject({
        custom_field: 'custom_value',
        another_option: 123,
      });
    });

    it('should handle empty prompt', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', '');

      expect(request).toMatchObject({
        messages: [{ role: 'user', content: '' }],
      });
    });

    it('should handle temperature 0', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        temperature: 0,
      });

      expect(request).toMatchObject({
        temperature: 0,
      });
    });

    it('should handle max temperature', () => {
      const request = RequestBuilder.buildChatRequest('gpt-3.5-turbo', 'Test', {
        temperature: 2.0,
      });

      expect(request).toMatchObject({
        temperature: 2.0,
      });
    });
  });

  describe('buildHuggingFaceRequest', () => {
    it('should build request with default options', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Hello, world!');

      expect(request).toEqual({
        inputs: 'Hello, world!',
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 1.0,
          top_k: 50,
          return_full_text: false,
        },
      });
    });

    it('should build request with custom max_tokens', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        max_tokens: 2048,
      });

      expect(request).toMatchObject({
        parameters: {
          max_new_tokens: 2048,
        },
      });
    });

    it('should build request with custom temperature', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        temperature: 0.9,
      });

      expect(request).toMatchObject({
        parameters: {
          temperature: 0.9,
        },
      });
    });

    it('should build request with custom top_p', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        top_p: 0.8,
      });

      expect(request).toMatchObject({
        parameters: {
          top_p: 0.8,
        },
      });
    });

    it('should build request with custom top_k', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        top_k: 100,
      });

      expect(request).toMatchObject({
        parameters: {
          top_k: 100,
        },
      });
    });

    it('should build request with all custom options', () => {
      const options: LLMOptions = {
        max_tokens: 2048,
        temperature: 0.9,
        top_p: 0.95,
        top_k: 100,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
      };

      const request = RequestBuilder.buildHuggingFaceRequest('Complex prompt', options);

      expect(request).toEqual({
        inputs: 'Complex prompt',
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.9,
          top_p: 0.95,
          top_k: 100,
          return_full_text: false,
          frequency_penalty: 0.5,
          presence_penalty: 0.3,
        },
      });
    });

    it('should handle empty prompt', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('');

      expect(request).toMatchObject({
        inputs: '',
      });
    });

    it('should handle temperature 0', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        temperature: 0,
      });

      expect(request).toMatchObject({
        parameters: {
          temperature: 0,
        },
      });
    });

    it('should handle top_k 0', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        top_k: 0,
      });

      expect(request).toMatchObject({
        parameters: {
          top_k: 0,
        },
      });
    });

    it('should always include return_full_text as false', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        max_tokens: 100,
      });

      expect(request).toMatchObject({
        parameters: {
          return_full_text: false,
        },
      });
    });

    it('should handle provider-specific options', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        custom_option: 'value',
        special_flag: true,
      } as LLMOptions);

      expect(request).toMatchObject({
        parameters: {
          custom_option: 'value',
          special_flag: true,
        },
      });
    });

    it('should handle stop sequences', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        stop: ['END', 'STOP'],
      });

      expect(request).toMatchObject({
        parameters: {
          stop: ['END', 'STOP'],
        },
      });
    });

    it('should handle repetition penalties', () => {
      const request = RequestBuilder.buildHuggingFaceRequest('Test', {
        frequency_penalty: 1.2,
        presence_penalty: 0.8,
      });

      expect(request).toMatchObject({
        parameters: {
          frequency_penalty: 1.2,
          presence_penalty: 0.8,
        },
      });
    });
  });
});
