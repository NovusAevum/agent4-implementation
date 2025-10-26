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

        return response.data;
      } catch (error: any) {
        lastError = error;

        // If it's not a retryable error, throw immediately
        if (!this.isRetryableError(error)) {
          throw new Error(`HuggingFace API error: ${error.message || 'Unknown error'}`);
        }

        // Don't wait after the last attempt
        if (attempt < this.maxRetries - 1) {
          const backoffTime = this.initialBackoff * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }
      }
    }

    throw new Error(
      `HuggingFace API error after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  private isRetryableError(error: any): boolean {
    if (error.response) {
      const status = error.response.status;
      return status === 429 || status === 503 || status >= 500;
    }
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
  }

  async generate(prompt: string, options: any = {}): Promise<string> {
    const {
      max_new_tokens = 512,
      temperature = 0.7,
      top_p = 0.95,
      repetition_penalty = 1.1,
    } = options;

    const requestOptions = {
      body: {
        inputs: prompt,
        parameters: {
          max_new_tokens,
          temperature,
          top_p,
          repetition_penalty,
          return_full_text: false,
        },
      },
    };

    const data = await this.makeRequestWithRetry(this.apiUrl, requestOptions);
    return data[0]?.generated_text || '';
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
