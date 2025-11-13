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

export class MistralProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly timeout: number = 30000;

  constructor(
    apiKey: string,
    model: string = 'mistral-small-latest',
    apiUrl: string = 'https://api.mistral.ai/v1/chat/completions'
  ) {
    super(apiKey);
    this.model = model;
    this.apiUrl = apiUrl;
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<string> {
    try {
      const data = RequestBuilder.buildChatRequest(this.model, prompt, options);

      logger.debug('Mistral API request', { model: this.model, prompt: prompt.substring(0, 50) });

      const response = await axios.post<LLMResponse>(this.apiUrl, data, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.timeout,
      });

      const content = ResponseParser.extractContent(response.data);
      logger.debug('Mistral API response received', { length: content.length });

      return content;
    } catch (error) {
      logger.error('Mistral API call failed', error as Error);
      ErrorHandler.logAndThrow(error, 'Mistral API');
    }
  }
}
