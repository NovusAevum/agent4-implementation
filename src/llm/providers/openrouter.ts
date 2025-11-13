import { BaseProvider } from './base';
import axios from 'axios';

export class OpenRouterProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly siteUrl: string;
  private readonly appName: string;

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

  async generate(prompt: string, options: any = {}): Promise<string> {
    const { max_tokens = 1024, temperature = 0.7, top_p = 1.0, ...otherOptions } = options;

    const data = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      top_p,
      ...otherOptions,
    };

    try {
      const response = await axios.post(this.apiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        },
        timeout: 30000, // 30 seconds
      });

      const result = response.data as any;
      return result.choices[0]?.message?.content || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error calling OpenRouter API:', errorMessage);
      throw new Error(`Failed to generate text: ${errorMessage}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test', { max_tokens: 10 });
      return true;
    } catch (error) {
      console.error('OpenRouter health check failed:', error);
      return false;
    }
  }
}
