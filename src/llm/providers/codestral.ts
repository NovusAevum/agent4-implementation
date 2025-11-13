import { BaseProvider } from './base';
import axios from 'axios';

export class CodestralProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(
    apiKey: string,
    model: string = 'codestral-latest',
    apiUrl: string = 'https://api.mistral.ai/v1/chat/completions'
  ) {
    super(apiKey);
    this.model = model;
    this.apiUrl = apiUrl;
  }

  async generate(prompt: string, options: any = {}): Promise<string> {
    const {
      max_tokens = 2048,
      temperature = 0.7,
      top_p = 1.0,
      ...otherOptions
    } = options;

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
        },
      });

      const result = response.data as any;
      return result.choices?.[0]?.message?.content || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error calling Codestral API:', errorMessage);
      throw new Error(`Failed to generate text: ${errorMessage}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test', { max_tokens: 10 });
      return true;
    } catch (error) {
      console.error('Codestral health check failed:', error);
      return false;
    }
  }
}
