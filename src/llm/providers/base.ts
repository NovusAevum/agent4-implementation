export interface LLMProvider {
  generate(prompt: string, options?: any): Promise<string>;
  checkHealth(): Promise<boolean>;
}

export abstract class BaseProvider implements LLMProvider {
  constructor(protected apiKey: string) {}

  abstract generate(prompt: string, options?: any): Promise<string>;
  
  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test connection', { max_tokens: 1 });
      return true;
    } catch (error) {
      console.error(`Health check failed for ${this.constructor.name}:`, error);
      return false;
    }
  }

  protected async makeRequest(endpoint: string, data: any, headers: Record<string, string> = {}) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`
      );
    }

    return response.json();
  }
}
