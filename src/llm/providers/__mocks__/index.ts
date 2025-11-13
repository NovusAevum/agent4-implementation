// Mock all providers for testing to prevent network requests
export class ContinueProvider {
  constructor() {}
  async checkHealth() {
    return false;
  }
  async generate() {
    return '';
  }
}

export class AlibabaProvider {
  constructor() {}
  async checkHealth() {
    return false;
  }
  async generate() {
    return '';
  }
}

export class KimiProvider {
  constructor() {}
  async checkHealth() {
    return false;
  }
  async generate() {
    return '';
  }
}

export class CodeCopilotProvider {
  constructor() {}
  async checkHealth() {
    return false;
  }
  async generate() {
    return '';
  }
}
