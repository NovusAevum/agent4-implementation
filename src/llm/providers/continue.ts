import { BaseProvider } from './base';

export class ContinueProvider extends BaseProvider {
  private readonly baseUrl = 'https://api.continue.dev/v1';

  async generate(prompt: string, options: any = {}): Promise<string> {
    const response = await this.makeRequest(
      `${this.baseUrl}/completions`,
      {
        model: 'gpt-4',
        prompt,
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        ...options,
      },
      {
        'Authorization': `Bearer ${this.apiKey}`,
      }
    );

    return response.choices[0].text.trim();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Continue provider health check failed:', error);
      return false;
    }
  }
}
