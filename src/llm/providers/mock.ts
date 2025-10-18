import { BaseProvider } from './base';
export class MockProvider extends BaseProvider {
  constructor() {
    super('mock-api-key');
  }

  async generate(prompt: string): Promise<string> {
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt cannot be empty');
    }
    return `This is a mock response to: ${prompt.substring(0, 50)}`;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}
