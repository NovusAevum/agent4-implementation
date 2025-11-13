import { ErrorHandler, ValidationError, ProviderError } from '../errors';

describe('ErrorHandler', () => {
  describe('format', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.format(error, 'TestContext');

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('TestContext: Test error');
    });

    it('should format string errors', () => {
      const result = ErrorHandler.format('String error', 'TestContext');

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('TestContext: String error');
    });

    it('should handle unknown errors', () => {
      const result = ErrorHandler.format(null, 'TestContext');

      expect(result.message).toBe('TestContext: Unknown error');
    });

    it('should work without context', () => {
      const error = new Error('Test');
      const result = ErrorHandler.format(error);

      expect(result.message).toBe('Test');
    });
  });

  describe('getMessage', () => {
    it('should extract message from Error', () => {
      const error = new Error('Test message');
      expect(ErrorHandler.getMessage(error)).toBe('Test message');
    });

    it('should handle string errors', () => {
      expect(ErrorHandler.getMessage('String error')).toBe('String error');
    });

    it('should handle objects with message property', () => {
      expect(ErrorHandler.getMessage({ message: 'Object error' })).toBe('Object error');
    });

    it('should return default for null/undefined', () => {
      expect(ErrorHandler.getMessage(null)).toBe('Unknown error');
      expect(ErrorHandler.getMessage(undefined)).toBe('Unknown error');
    });
  });

  describe('isRetryable', () => {
    it('should identify retryable HTTP status codes', () => {
      expect(ErrorHandler.isRetryable({ response: { status: 408 } })).toBe(true); // Timeout
      expect(ErrorHandler.isRetryable({ response: { status: 429 } })).toBe(true); // Rate limit
      expect(ErrorHandler.isRetryable({ response: { status: 500 } })).toBe(true); // Server error
      expect(ErrorHandler.isRetryable({ response: { status: 503 } })).toBe(true); // Service unavailable
    });

    it('should identify non-retryable HTTP status codes', () => {
      expect(ErrorHandler.isRetryable({ response: { status: 400 } })).toBe(false);
      expect(ErrorHandler.isRetryable({ response: { status: 401 } })).toBe(false);
      expect(ErrorHandler.isRetryable({ response: { status: 404 } })).toBe(false);
    });

    it('should identify retryable error codes', () => {
      expect(ErrorHandler.isRetryable({ code: 'ETIMEDOUT' })).toBe(true);
      expect(ErrorHandler.isRetryable({ code: 'ECONNRESET' })).toBe(true);
      expect(ErrorHandler.isRetryable({ code: 'ECONNREFUSED' })).toBe(true);
    });

    it('should identify retryable error messages', () => {
      expect(ErrorHandler.isRetryable({ message: 'Connection timeout' })).toBe(true);
      expect(ErrorHandler.isRetryable({ message: 'Rate limit exceeded' })).toBe(true);
      expect(ErrorHandler.isRetryable({ message: 'Service unavailable' })).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(ErrorHandler.isRetryable(null)).toBe(false);
      expect(ErrorHandler.isRetryable('string')).toBe(false);
      expect(ErrorHandler.isRetryable({ message: 'Invalid request' })).toBe(false);
    });
  });

  describe('toResponse', () => {
    it('should hide details in production', () => {
      const error = new Error('Sensitive error');
      const response = ErrorHandler.toResponse(error, false);

      expect(response.success).toBe(false);
      expect(response.error).toBe('An error occurred while processing your request');
      expect(response.details).toBeUndefined();
    });

    it('should show details in development', () => {
      const error = new Error('Debug error');
      const response = ErrorHandler.toResponse(error, true);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Debug error');
      expect(response.details).toBeDefined();
      expect(response.details?.[0].message).toBe('Debug error');
    });
  });

  describe('Custom Errors', () => {
    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid input', 'email');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBe('email');
    });

    it('should create ProviderError', () => {
      const originalError = new Error('API failed');
      const error = new ProviderError('Provider failed', 'mistral', originalError);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderError');
      expect(error.provider).toBe('mistral');
      expect(error.originalError).toBe(originalError);
    });
  });
});
