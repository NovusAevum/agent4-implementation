/**
 * Centralized error handling utilities
 * Consolidates duplicate error handling patterns across the codebase
 */

export class ErrorHandler {
  /**
   * Formats any error type into a standard Error object with message
   * @param error - The error to format (can be Error, string, or unknown)
   * @param context - Context string to prefix the error message
   * @returns Formatted Error object
   */
  static format(error: unknown, context?: string): Error {
    const message = error instanceof Error ? error.message : String(error || 'Unknown error');
    const prefix = context ? `${context}: ` : '';
    return error instanceof Error
      ? new Error(`${prefix}${message}`)
      : new Error(`${prefix}${message}`);
  }

  /**
   * Extracts error message from any error type
   * @param error - The error to extract message from
   * @returns Error message string
   */
  static getMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error';
  }

  /**
   * Logs error and throws formatted error
   * @param error - The error to log and throw
   * @param context - Context for the error
   * @param logger - Optional logger function (defaults to console.error)
   * @throws {Error} Always throws the formatted error
   */
  static logAndThrow(
    error: unknown,
    context: string,
    logger: (message: string, ...args: unknown[]) => void = console.error
  ): never {
    const message = this.getMessage(error);
    logger(`Error in ${context}:`, message);
    throw this.format(error, context);
  }

  /**
   * Converts error to HTTP response format
   * @param error - The error to convert
   * @param isDevelopment - Whether in development mode (shows details)
   * @returns Error response object
   */
  static toResponse(error: unknown, isDevelopment: boolean = false): ErrorResponse {
    const message = this.getMessage(error);

    if (!isDevelopment) {
      return {
        success: false,
        error: 'An error occurred while processing your request',
      };
    }

    return {
      success: false,
      error: message,
      details:
        error instanceof Error ? [{ field: 'execution', message: error.message }] : undefined,
    };
  }

  /**
   * Checks if error is retryable (network errors, timeouts, rate limits)
   * @param error - The error to check
   * @returns True if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const err = error as any;

    // Check HTTP status codes
    if (err.response?.status) {
      const status = err.response.status;
      // Retry on: 408 (Timeout), 429 (Rate Limit), 500+ (Server Errors), 503 (Service Unavailable)
      return status === 408 || status === 429 || status >= 500;
    }

    // Check error codes
    if (err.code) {
      const retryableCodes = [
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ENETUNREACH',
        'EAI_AGAIN',
      ];
      return retryableCodes.includes(err.code);
    }

    // Check error messages
    if (err.message) {
      const message = err.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('service unavailable') ||
        message.includes('connection') ||
        message.includes('network')
      );
    }

    return false;
  }

  /**
   * Wraps async function with error handling
   * @param fn - Async function to wrap
   * @param context - Context for errors
   * @returns Wrapped function
   */
  static wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context: string): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      try {
        return await fn(...args);
      } catch (error) {
        throw this.format(error, context);
      }
    }) as T;
  }
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Custom error types for better error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
