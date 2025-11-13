import { LLMOptions, logger, ErrorHandler } from '../../utils';

/**
 * Base LLM Provider interface
 * All providers must implement these methods
 */
export interface LLMProvider {
  generate(prompt: string, options?: LLMOptions): Promise<string>;
  checkHealth(): Promise<boolean>;
}

/**
 * Abstract base class for all LLM providers
 * Provides common functionality and health checking
 */
export abstract class BaseProvider implements LLMProvider {
  constructor(protected apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`${this.constructor.name}: API key is required`);
    }
  }

  /**
   * Generate text from prompt - must be implemented by each provider
   */
  abstract generate(prompt: string, options?: LLMOptions): Promise<string>;

  /**
   * Check if provider is healthy and can accept requests
   * Can be overridden by specific providers for custom health checks
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.generate('Test connection', { max_tokens: 1 });
      logger.info(`Health check passed for ${this.constructor.name}`);
      return true;
    } catch (error) {
      logger.warn(`Health check failed for ${this.constructor.name}`, {
        error: ErrorHandler.getMessage(error),
      });
      return false;
    }
  }
}
