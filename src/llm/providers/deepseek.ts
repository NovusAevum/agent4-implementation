import { BaseProvider } from './base';
import fetch from 'node-fetch';

export class DeepSeekProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(
    apiKey: string,
    model: string = 'deepseek-coder',
    apiUrl: string = 'https://api.deepseek.com/v1/chat/completions'
  ) {
    super(apiKey);
    this.model = model;
    this.apiUrl = apiUrl;
  }

  async generate(prompt: string, options: any = {}): Promise<string> {
    const { max_tokens = 2048, temperature = 0.7, top_p = 1.0, ...otherOptions } = options;

    const data = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      top_p,
      ...otherOptions,
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `DeepSeek API error (${response.status}): ${(errorData as any)?.error?.message || response.statusText}`
        );
      }

      const result = (await response.json()) as any;
      return result.choices[0]?.message?.content || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error calling DeepSeek API:', errorMessage);
      throw new Error(`Failed to generate text: ${errorMessage}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test', { max_tokens: 10 });
      return true;
    } catch (error) {
      console.error('DeepSeek health check failed:', error);
      return false;
    }
  }
}
