import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from './config/index';
import { Agent4Workflow } from './agent4/workflow';
import { FallbackLLM } from './llm/fallback';
import { logger, ErrorHandler, metrics } from './utils';
import { initTelemetry } from './telemetry';

// Initialize OpenTelemetry (if enabled)
initTelemetry();

// Initialize Express app
const app = express();
const PORT = config.PORT;

// Create singleton FallbackLLM instance to prevent memory leaks
// (Each request reuses the same instance instead of creating new ones)
const sharedLLM = new FallbackLLM();

// Request validation schema
const executeRequestSchema = z.object({
  task: z
    .string()
    .min(1, 'Task cannot be empty')
    .max(10000, 'Task is too long (max 10000 characters)'),
  context: z.record(z.unknown()).optional().default({}),
});

// Middleware
app.use(
  cors({
    origin: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(','),
    // Only enable credentials with specific origins (not wildcard)
    credentials: config.CORS_ORIGIN !== '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Request-ID', 'X-Response-Time'],
    maxAge: 86400, // 24 hours preflight cache
    optionsSuccessStatus: 204, // Some legacy browsers choke on 204
  })
);
app.use(express.json({ limit: '1mb' })); // Limit request body size

// Request ID middleware for error tracking
app.use((req, _res, next) => {
  req.headers['x-request-id'] =
    req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const healthStatus = metrics.getHealthStatus();
  res.status(200).json({
    status: healthStatus.status,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    uptime: metrics.getFormattedUptime(),
    health: healthStatus,
  });
});

// Metrics endpoint
app.get('/metrics', (_req: Request, res: Response) => {
  try {
    const systemMetrics = metrics.getSystemMetrics();
    res.status(200).json({
      success: true,
      metrics: systemMetrics,
    });
  } catch (error) {
    logger.error('Failed to retrieve metrics', ErrorHandler.format(error));
    const errorResponse = ErrorHandler.toResponse(error, config.NODE_ENV !== 'production');
    res.status(500).json(errorResponse);
  }
});

// Main Agent4 API endpoint
app.post('/api/agent4/execute', async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  const startTime = Date.now();

  try {
    // Validate request body
    const validationResult = executeRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn('Invalid request', {
        requestId,
        errors: validationResult.error.errors,
      });
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
        requestId,
      });
      return;
    }

    const { task, context } = validationResult.data;

    logger.info('Agent4 execution started', {
      requestId,
      taskLength: task.length,
      hasContext: Object.keys(context).length > 0,
    });

    // Reuse shared LLM instance to prevent memory leaks
    const agent = new Agent4Workflow(sharedLLM);
    const result = await agent.run(task, context);

    const duration = Date.now() - startTime;
    logger.info('Agent4 execution successful', {
      requestId,
      taskLength: task.length,
      duration,
      plan: result.plan?.substring(0, 100) || 'N/A',
    });

    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.json({
      success: true,
      data: result,
      requestId,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Agent4 execution error', ErrorHandler.format(error), {
      requestId,
      duration,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    });

    // Use ErrorHandler to create safe response
    const errorResponse = ErrorHandler.toResponse(error, config.NODE_ENV !== 'production');

    res.setHeader('X-Request-ID', requestId);
    res.status(500).json({
      ...errorResponse,
      requestId,
      duration,
    });
  }
});

// Start the server
const server = app.listen(PORT, () => {
  logger.info('Agent4 server started', {
    port: PORT,
    environment: config.NODE_ENV,
    url: `http://localhost:${PORT}`,
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', ErrorHandler.format(reason), {
    promise: String(promise),
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', ErrorHandler.format(error));
  process.exit(1);
});

/**
 * Graceful shutdown handler
 * Properly closes server and cleans up resources
 */
function gracefulShutdown(signal: string) {
  logger.info('Graceful shutdown initiated', { signal });

  server.close(() => {
    logger.info('HTTP server closed');
    sharedLLM.destroy();
    logger.info('Resources cleaned up');
    process.exit(0);
  });

  // Force shutdown after timeout (60s to accommodate long-running LLM requests)
  setTimeout(() => {
    logger.error('Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, 60000); // 60 seconds to allow LLM requests (which can take 30+ seconds) to complete
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
