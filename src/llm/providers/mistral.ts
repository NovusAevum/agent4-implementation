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
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error(`Mistral API error: ${error}`);
    }
  }
}
