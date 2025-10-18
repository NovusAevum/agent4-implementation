import { BaseProvider } from './base';

export class AlibabaProvider extends BaseProvider {
  private readonly baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  async generate(prompt: string, options: any = {}): Promise<string> {
    const response = await this.makeRequest(
      this.baseUrl,
      {
        model: 'qwen-max',
        input: {
          prompt,
        },
        parameters: {
          max_tokens: options.max_tokens || 1000,
          temperature: options.temperature || 0.7,
          ...options,
        },
      },
      {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-DashScope-SSE': 'enable',
      }
    );

    return response.output.text;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/status', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Alibaba Qwen provider health check failed:', error);
      return false;
    }
  }
}
