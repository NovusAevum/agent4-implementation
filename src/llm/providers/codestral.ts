import { BaseProvider } from './base';
import fetch from 'node-fetch';

export class CodestralProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(
    apiKey: string,
    model: string = 'codestral-latest',
    apiUrl: string = 'https://codestral.mistral.ai/v1/fim/completions'
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
      suffix = '',
      ...otherOptions
    } = options;

    const data = {
      model: this.model,
      prompt,
      suffix,
      max_tokens,
      temperature,
      top_p,
      ...otherOptions
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Codestral API error (${response.status}): ${(errorData as any)?.error?.message || response.statusText}`
        );
      }

      const result = await response.json() as any;
      return result.choices[0]?.message || result.choices[0]?.text || '';
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
