import { LLMProvider } from './providers/base';
import { ContinueProvider } from './providers/continue';
import { AlibabaProvider } from './providers/alibaba';
import { KimiProvider } from './providers/kimi';
import { CodeCopilotProvider } from './providers/codecopilot';
import { config } from '../config';

export class FallbackLLM {
  private providers: { name: string; provider: LLMProvider }[] = [];
  private currentProviderIndex = 0;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeProviders();
    }
    
    await this.initializationPromise;
  }

  private async initializeProviders() {
    const providerOrder = config.FALLBACK_ORDER.split(',').map(p => p.trim());
    
    for (const name of providerOrder) {
      try {
        let provider: LLMProvider | null = null;
        
        switch (name.toLowerCase()) {
          case 'continue':
            provider = new ContinueProvider(config.CONTINUE_API_KEY);
            break;
          case 'alibaba':
            provider = new AlibabaProvider(config.ALIBABA_QWEN_API_KEY);
            break;
          case 'kimi':
            provider = new KimiProvider(config.KIMI_API_KEY);
            break;
          case 'codestral':
            provider = new CodeCopilotProvider(config.CODECOPILOT_KEY);
            break;
        }

        if (provider && await provider.checkHealth()) {
          this.providers.push({ name, provider });
          console.log(`Initialized ${name} provider successfully`);
        }
      } catch (error) {
        console.warn(`Failed to initialize ${name} provider:`, error.message);
      }
    }

    if (this.providers.length === 0) {
      throw new Error('No working LLM providers available');
    }

    this.initialized = true;
    console.log(`Initialized ${this.providers.length} LLM providers`);
  }

  async generate(prompt: string, options: any = {}): Promise<string> {
    await this.initialize();
    
    let lastError: Error | null = null;
    const maxRetries = this.providers.length * 2; // Allow cycling through all providers twice
    
    for (let i = 0; i < maxRetries; i++) {
      const { name, provider } = this.providers[this.currentProviderIndex];
      
      try {
        console.log(`Using ${name} provider for generation`);
        const result = await provider.generate(prompt, options);
        return result;
      } catch (error) {
        console.error(`Error with ${name} provider:`, error.message);
        lastError = error;
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
      }
    }

    throw lastError || new Error('All LLM providers failed to generate a response');
  }

  getActiveProviderName(): string {
    if (this.providers.length === 0) return 'none';
    return this.providers[this.currentProviderIndex].name;
  }
}
