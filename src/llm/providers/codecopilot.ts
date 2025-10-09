import { BaseProvider } from './base';

export class CodeCopilotProvider extends BaseProvider {
  private readonly baseUrl = 'https://api.codestral.mistral.ai/v1';

  async generate(prompt: string, options: any = {}): Promise<string> {
    const response = await this.makeRequest(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'codestral-latest',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.2, // Lower temperature for code generation
        ...options,
      },
      {
        'Authorization': `Bearer ${this.apiKey}`,
      }
    );

    return response.choices[0].message.content.trim();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('CodeCopilot provider health check failed:', error);
      return false;
    }
  }
}
