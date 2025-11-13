import { BaseProvider } from './base';
import axios from 'axios';

export class MistralProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(
    apiKey: string,
    model: string = 'mistral-small-latest',
    apiUrl: string = 'https://api.mistral.ai/v1/chat/completions'
  ) {
    super(apiKey);
    this.model = model;
    this.apiUrl = apiUrl;
  }

  async generate(prompt: string, options: any = {}): Promise<string> {
    const { max_tokens = 1024, temperature = 0.7, top_p = 1.0 } = options;

    const data = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      top_p,
    };

    try {
      const response = await axios.post(this.apiUrl, data, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds
      });

      const result = response.data as any;
      return result.choices?.[0]?.message?.content || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error calling Mistral API:', errorMessage);
      throw new Error(`Failed to generate text: ${errorMessage}`);
    }
  }
}
