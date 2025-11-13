import { BaseProvider } from './base';
import axios from 'axios';
import { config } from '../../config';
import {
  ErrorHandler,
  logger,
  LLMOptions,
  HuggingFaceResponse,
  ResponseParser,
  RequestBuilder,
} from '../../utils';

export class HuggingFaceProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly maxRetries: number;
  private readonly initialBackoff: number;
  private readonly timeout: number;

  constructor(
    apiKey: string = config.HF_TOKEN,
    model: string = 'mistralai/Mistral-7B-Instruct-v0.1',
    apiUrl: string = 'https://api-inference.huggingface.co/models'
  ) {
    super(apiKey);
    this.apiUrl = `${apiUrl}/${model}`;
    this.maxRetries = 3;
    this.initialBackoff = 1000; // 1 second
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Make HTTP request with exponential backoff retry logic
   */
  private async makeRequestWithRetry(
    url: string,
    data: Record<string, unknown>
  ): Promise<HuggingFaceResponse | HuggingFaceResponse[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        logger.debug('HuggingFace API request', { attempt: attempt + 1, url });

        const response = await axios.post<HuggingFaceResponse | HuggingFaceResponse[]>(url, data, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        });

        return response.data;
      } catch (error) {
        lastError = ErrorHandler.format(error);

        // If it's not a retryable error, throw immediately
        if (!ErrorHandler.isRetryable(error)) {
          logger.error('HuggingFace non-retryable error', lastError);
          ErrorHandler.logAndThrow(error, 'HuggingFace API');
        }

        // Don't wait after the last attempt
        if (attempt < this.maxRetries - 1) {
          const backoffTime = this.initialBackoff * Math.pow(2, attempt);
          logger.debug('Retrying HuggingFace request', {
            attempt: attempt + 1,
            backoffMs: backoffTime,
          });
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }
      }
    }

    logger.error('HuggingFace API failed after retries', lastError!);
    throw new Error(
      `HuggingFace API error after ${this.maxRetries} attempts: ${ErrorHandler.getMessage(lastError)}`
    );
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<string> {
    try {
      const data = RequestBuilder.buildHuggingFaceRequest(prompt, options);

      logger.debug('HuggingFace generate request', {
        prompt: prompt.substring(0, 50),
        options,
      });

      const response = await this.makeRequestWithRetry(
        this.apiUrl,
        data as Record<string, unknown>
      );
      const content = ResponseParser.extractHuggingFaceContent(response);

      logger.debug('HuggingFace response received', { length: content.length });

      return content;
    } catch (error) {
      logger.error('HuggingFace generate failed', error as Error);
      ErrorHandler.logAndThrow(error, 'HuggingFace API');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test', { max_tokens: 10 });
      logger.info('HuggingFace health check passed');
      return true;
    } catch (error) {
      logger.warn('HuggingFace health check failed', {
        error: ErrorHandler.getMessage(error),
      });
      return false;
    }
  }
}
