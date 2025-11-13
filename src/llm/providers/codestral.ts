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

export class CodestralProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly timeout: number = 30000;

  constructor(
    apiKey: string,
    model: string = 'codestral-latest',
    apiUrl: string = 'https://api.mistral.ai/v1/chat/completions'
  ) {
    super(apiKey);
    this.model = model;
    this.apiUrl = apiUrl;
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<string> {
    try {
      const data = RequestBuilder.buildChatRequest(this.model, prompt, {
        max_tokens: 2048, // Codestral default for code generation
        ...options,
      });

      logger.debug('Codestral API request', { model: this.model, prompt: prompt.substring(0, 50) });

      const response = await axios.post<LLMResponse>(this.apiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: this.timeout,
      });

      const content = ResponseParser.extractContent(response.data);
      logger.debug('Codestral API response received', { length: content.length });

      return content;
    } catch (error) {
      logger.error('Codestral API call failed', error as Error);
      ErrorHandler.logAndThrow(error, 'Codestral API');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test', { max_tokens: 10 });
      logger.info('Codestral health check passed');
      return true;
    } catch (error) {
      logger.warn('Codestral health check failed', { error: ErrorHandler.getMessage(error) });
      return false;
    }
  }
}
