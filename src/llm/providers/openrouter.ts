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

export class OpenRouterProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly siteUrl: string;
  private readonly appName: string;
  private readonly timeout: number = 30000;

  constructor(
    apiKey: string,
    model: string = 'mistralai/mistral-7b-instruct',
    apiUrl: string = 'https://openrouter.ai/api/v1/chat/completions',
    siteUrl: string = 'https://github.com/agent4-implementation',
    appName: string = 'Agent4 Implementation'
  ) {
    super(apiKey);
    this.model = model;
    this.apiUrl = apiUrl;
    this.siteUrl = siteUrl;
    this.appName = appName;
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<string> {
    try {
      const data = RequestBuilder.buildChatRequest(this.model, prompt, options);

      logger.debug('OpenRouter API request', {
        model: this.model,
        prompt: prompt.substring(0, 50),
      });

      const response = await axios.post<LLMResponse>(this.apiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        },
        timeout: this.timeout,
      });

      const content = ResponseParser.extractContent(response.data);
      logger.debug('OpenRouter API response received', { length: content.length });

      return content;
    } catch (error) {
      logger.error('OpenRouter API call failed', error as Error);
      ErrorHandler.logAndThrow(error, 'OpenRouter API');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test', { max_tokens: 10 });
      logger.info('OpenRouter health check passed');
      return true;
    } catch (error) {
      logger.warn('OpenRouter health check failed', { error: ErrorHandler.getMessage(error) });
      return false;
    }
  }
}
