import { BaseProvider } from './base';
import axios from 'axios';
import {
  ErrorHandler,
  logger,
  LLMResponse,
  LLMOptions,
  ResponseParser,
  RequestBuilder,
} from '../../utils';

export class DeepSeekProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly timeout: number = 30000;

  constructor(
    apiKey: string,
    model: string = 'deepseek-coder',
    apiUrl: string = 'https://api.deepseek.com/v1/chat/completions'
  ) {
    super(apiKey);
    this.model = model;
    this.apiUrl = apiUrl;
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<string> {
    try {
      // DeepSeek supports additional options, so we pass them through
      const data = RequestBuilder.buildChatRequest(this.model, prompt, {
        max_tokens: 2048, // DeepSeek default
        ...options,
      });

      logger.debug('DeepSeek API request', { model: this.model, prompt: prompt.substring(0, 50) });

      const response = await axios.post<LLMResponse>(this.apiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: this.timeout,
      });

      const content = ResponseParser.extractContent(response.data);
      logger.debug('DeepSeek API response received', { length: content.length });

      return content;
    } catch (error) {
      logger.error('DeepSeek API call failed', error as Error);
      ErrorHandler.logAndThrow(error, 'DeepSeek API');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test', { max_tokens: 10 });
      logger.info('DeepSeek health check passed');
      return true;
    } catch (error) {
      logger.warn('DeepSeek health check failed', { error: ErrorHandler.getMessage(error) });
      return false;
    }
  }
}
