import { BaseProvider } from './base';
import axios from 'axios';
import { config } from '../../config';

export class HuggingFaceProvider extends BaseProvider {
  private readonly apiUrl: string;
  private readonly maxRetries: number;
  private readonly initialBackoff: number;
  private readonly timeout: number;

  constructor(
    apiKey: string = config.HF_TOKEN,
    model: string = 'mistralai/Mistral-7B-Instruct-v0.1',
    apiUrl: string = 'https://api-inference.huggingface.co/models'
  ) {
    super(apiKey);
    this.apiUrl = `${apiUrl}/${model}`;
    this.maxRetries = 3;
    this.initialBackoff = 1000; // 1 second
    this.timeout = 30000; // 30 seconds
  }

  private async makeRequestWithRetry(url: string, options: any): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await axios({
          method: 'POST',
          url,
          data: options.body,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
          timeout: this.timeout,
        });

        if (response.status >= 400) {
          const errorData = response.data;
          throw new Error(
            `Hugging Face API error (${response.status}): ${
              (errorData as any)?.error || response.statusText
            }`
          );
        }

        return response.data;
      } catch (error: any) {
        lastError = error;

        const backoff = this.initialBackoff * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${backoff}ms...`, error.message);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  async generate(prompt: string, options: any = {}): Promise<string> {
    const { maxTokens = 500, temperature = 0.7, top_p = 0.9, ...otherOptions } = options;

    const data = {
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature,
        top_p,
        return_full_text: false,
        ...otherOptions,
      },
    };

    try {
      const response = await this.makeRequestWithRetry(this.apiUrl, {
        body: data,
      });

      if (Array.isArray(response) && response[0]?.generated_text) {
        return response[0].generated_text;
      }

      throw new Error('Unexpected response format from Hugging Face API');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error calling Hugging Face API:', errorMessage);
      throw new Error(`Failed to generate text: ${errorMessage}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Check if the model is ready
      const response = await axios.post(this.apiUrl, {}, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('Hugging Face health check failed:', error);
      return false;
    }
  }
}
