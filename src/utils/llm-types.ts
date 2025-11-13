/**
 * Type definitions for LLM API responses
 * Eliminates 'as any' casts and provides type safety
 */

/**
 * Standard LLM API response structure (OpenAI-compatible format)
 * Used by: Mistral, DeepSeek, OpenRouter, Codestral
 */
export interface LLMResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: Array<{
    index?: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason?: string;
    logprobs?: unknown;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Hugging Face API response structure
 */
export interface HuggingFaceResponse {
  generated_text?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * LLM generation options
 */
export interface LLMOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  n?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  [key: string]: unknown; // Allow provider-specific options
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey: string;
  model: string;
  apiUrl: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Response parser utility
 */
export class ResponseParser {
  /**
   * Extract content from standard LLM response
   */
  static extractContent(response: LLMResponse): string {
    return response.choices?.[0]?.message?.content || '';
  }

  /**
   * Extract content from Hugging Face response
   */
  static extractHuggingFaceContent(response: HuggingFaceResponse | HuggingFaceResponse[]): string {
    if (Array.isArray(response)) {
      return response[0]?.generated_text || '';
    }
    return response.generated_text || '';
  }

  /**
   * Extract token usage from response
   */
  static extractUsage(response: LLMResponse): TokenUsage | null {
    if (!response.usage) {
      return null;
    }

    return {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    };
  }

  /**
   * Validate response has required fields
   */
  static isValidResponse(response: unknown): response is LLMResponse {
    if (!response || typeof response !== 'object') {
      return false;
    }

    const resp = response as Partial<LLMResponse>;
    return (
      Array.isArray(resp.choices) &&
      resp.choices.length > 0 &&
      typeof resp.choices[0]?.message?.content === 'string'
    );
  }

  /**
   * Validate Hugging Face response
   */
  static isValidHuggingFaceResponse(response: unknown): response is HuggingFaceResponse {
    if (!response) {
      return false;
    }

    if (Array.isArray(response)) {
      return response.length > 0 && typeof response[0]?.generated_text === 'string';
    }

    const resp = response as Partial<HuggingFaceResponse>;
    return typeof resp.generated_text === 'string';
  }
}

/**
 * Request builder utility
 */
export class RequestBuilder {
  /**
   * Build standard chat completion request
   */
  static buildChatRequest(model: string, prompt: string, options: LLMOptions = {}): object {
    const { max_tokens = 1024, temperature = 0.7, top_p = 1.0, ...otherOptions } = options;

    return {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      top_p,
      ...otherOptions,
    };
  }

  /**
   * Build Hugging Face request
   */
  static buildHuggingFaceRequest(prompt: string, options: LLMOptions = {}): object {
    const {
      max_tokens = 1024,
      temperature = 0.7,
      top_p = 1.0,
      top_k = 50,
      ...otherOptions
    } = options;

    return {
      inputs: prompt,
      parameters: {
        max_new_tokens: max_tokens,
        temperature,
        top_p,
        top_k,
        return_full_text: false,
        ...otherOptions,
      },
    };
  }
}
