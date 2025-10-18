import { BaseProvider } from './base';

export class KimiProvider extends BaseProvider {
  private readonly baseUrl = 'https://api.moonshot.cn/v1';

  async generate(prompt: string, options: any = {}): Promise<string> {
    const response = await this.makeRequest(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'kimi-2',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        ...options,
      },
      {
        Authorization: `Bearer ${this.apiKey}`,
      }
    );

    return response.choices[0].message.content.trim();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Kimi provider health check failed:', error);
      return false;
    }
  }
}
