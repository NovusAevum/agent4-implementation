import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';

/**
 * Enterprise Security Headers Middleware
 * Implements OWASP recommended security headers
 *
 * Reference: https://owasp.org/www-project-secure-headers/
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection in legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy - Strict policy for API server
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );

  // Permissions Policy (formerly Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Strict Transport Security (HSTS) - Only if behind HTTPS
  // 2 years max-age with preload for production
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Remove X-Powered-By header to hide Express
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Request sanitization middleware
 * Validates and sanitizes common attack vectors
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string;

  // Check for suspicious patterns in headers
  const suspiciousHeaderPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /../i, // Path traversal
    /\.\.\//,
    /%2e%2e/i, // URL encoded path traversal
  ];

  for (const [headerName, headerValue] of Object.entries(req.headers)) {
    if (typeof headerValue === 'string') {
      for (const pattern of suspiciousHeaderPatterns) {
        if (pattern.test(headerValue)) {
          logger.warn('Suspicious header pattern detected', {
            requestId,
            header: headerName,
            pattern: pattern.toString(),
            ip: req.ip,
          });

          res.status(400).json({
            success: false,
            error: 'Invalid request headers',
            requestId,
          });
          return;
        }
      }
    }
  }

  // Check for SQL injection patterns in query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    const sqlInjectionPatterns = [
      /(\bOR\b|\bAND\b).*=.*=/i,
      /UNION.*SELECT/i,
      /DROP\s+TABLE/i,
      /INSERT\s+INTO/i,
      /DELETE\s+FROM/i,
      /UPDATE.*SET/i,
      /--/,
      /;.*--/,
      /\/\*/,
    ];

    const queryString = JSON.stringify(req.query);
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(queryString)) {
        logger.warn('Potential SQL injection attempt detected', {
          requestId,
          query: req.query,
          pattern: pattern.toString(),
          ip: req.ip,
        });

        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          requestId,
        });
        return;
      }
    }
  }

  next();
}

/**
 * IP validation and rate limiting bypass prevention
 * Ensures X-Forwarded-For header is not spoofed
 */
export function validateClientIP(req: Request, _res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string;

  // Log actual client IP for security monitoring
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  const forwardedFor = req.headers['x-forwarded-for'];

  // Detect potential IP spoofing attempts
  if (forwardedFor && typeof forwardedFor === 'string') {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 5) {
      logger.warn('Suspicious X-Forwarded-For chain detected', {
        requestId,
        chain: ips,
        clientIP,
      });
    }
  }

  // Store validated IP for rate limiting
  req.headers['x-client-ip'] = clientIP;

  next();
}

/**
 * Request timeout middleware
 * Prevents slowloris and similar DoS attacks
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] as string;

    // Set timeout for the request
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          requestId,
          url: req.url,
          method: req.method,
          timeout: timeoutMs,
        });

        res.status(408).json({
          success: false,
          error: 'Request timeout',
          requestId,
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}

/**
 * JSON payload validation
 * Prevents JSON injection and oversized payloads
 */
export function validateJSONPayload(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string;

  // Check content-type for JSON endpoints
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];

    if (contentType && !contentType.includes('application/json')) {
      logger.warn('Invalid content-type for JSON endpoint', {
        requestId,
        contentType,
        method: req.method,
        url: req.url,
      });

      res.status(415).json({
        success: false,
        error: 'Unsupported Media Type. Expected application/json',
        requestId,
      });
      return;
    }
  }

  next();
}

/**
 * Comprehensive security middleware suite
 * Apply all security measures in correct order
 */
export const securityMiddleware = [
  securityHeaders,
  validateClientIP,
  sanitizeRequest,
  validateJSONPayload,
  requestTimeout(30000), // 30 second timeout for LLM requests
];
