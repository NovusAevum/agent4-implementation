/**
 * Input sanitization utilities for LLM prompts and user input
 * Prevents prompt injection attacks and malicious input
 */

import { logger } from './logger';

/**
 * Sanitize user input for LLM prompts
 * Removes potential prompt injection patterns
 *
 * @param input - The user input string to sanitize
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns Sanitized string safe for LLM prompts
 *
 * @example
 * ```ts
 * const safe = sanitizePromptInput("Ignore previous instructions");
 * // Returns: "" (injection pattern removed)
 * ```
 */
export function sanitizePromptInput(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') {
    logger.warn('sanitizePromptInput received non-string input', { type: typeof input });
    return String(input).substring(0, maxLength);
  }

  // Remove potential prompt injection patterns
  let sanitized = input
    // Remove system instruction patterns
    .replace(/\[SYSTEM\]/gi, '[USER_SYSTEM]')
    .replace(/\[INSTRUCTION\]/gi, '[USER_INSTRUCTION]')
    .replace(/\[ASSISTANT\]/gi, '[USER_ASSISTANT]')
    .replace(/\[AI\]/gi, '[USER_AI]')

    // Remove attempts to override instructions
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, '')
    .replace(/disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/gi, '')
    .replace(/forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/gi, '')

    // Remove attempts to extract sensitive data
    .replace(/show\s+(me\s+)?(all\s+)?(api\s*keys?|secrets?|credentials?|tokens?|passwords?)/gi, '')
    .replace(/display\s+(all\s+)?(api\s*keys?|secrets?|credentials?|tokens?|passwords?)/gi, '')
    .replace(/output\s+(all\s+)?(api\s*keys?|secrets?|credentials?|tokens?|passwords?)/gi, '')
    .replace(/print\s+(all\s+)?(api\s*keys?|secrets?|credentials?|tokens?|passwords?)/gi, '')

    // Remove role manipulation attempts
    .replace(/you\s+are\s+now\s+(?:an?\s+)?(?:admin|root|system|developer)/gi, '')
    .replace(/act\s+as\s+(?:an?\s+)?(?:admin|root|system|developer)/gi, '')
    .replace(/pretend\s+(?:to\s+be\s+)?(?:an?\s+)?(?:admin|root|system)/gi, '')

    // Trim whitespace
    .trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    logger.warn('Input truncated due to length', {
      original: sanitized.length,
      truncated: maxLength,
    });
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize context objects to prevent injection through nested fields
 *
 * @param context - The context object to sanitize
 * @returns JSON string representation with size limits
 *
 * @example
 * ```ts
 * const json = sanitizeContext({ user: "john", role: "admin" });
 * // Returns: '{"user":"john","role":"admin"}'
 * ```
 */
export function sanitizeContext(context: Record<string, unknown>): string {
  try {
    // Convert to JSON with size limit
    const jsonString = JSON.stringify(context, null, 2);

    if (jsonString.length > 50000) {
      logger.warn('Context object too large, truncating', {
        size: jsonString.length,
        limit: 50000,
      });
      return jsonString.substring(0, 50000) + '\n... (truncated)';
    }

    return jsonString;
  } catch (error) {
    logger.error('Failed to sanitize context');
    return '{}';
  }
}

/**
 * Validate and sanitize task input from API
 * Removes control characters and applies prompt sanitization
 *
 * @param task - The task string to validate and sanitize
 * @returns Sanitized task string
 * @throws {Error} If task is empty after sanitization
 *
 * @example
 * ```ts
 * const clean = sanitizeTaskInput("Create a function\x00");
 * // Returns: "Create a function" (null byte removed)
 * ```
 */
export function sanitizeTaskInput(task: string): string {
  if (!task || typeof task !== 'string') {
    throw new Error('Task must be a non-empty string');
  }

  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex
  let sanitized = task.replace(/\x00/g, '').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Apply prompt sanitization
  sanitized = sanitizePromptInput(sanitized);

  if (sanitized.trim().length === 0) {
    throw new Error('Task cannot be empty after sanitization');
  }

  return sanitized;
}
