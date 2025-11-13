import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from './config/index';
import { Agent4Workflow } from './agent4/workflow';
import { FallbackLLM } from './llm/fallback';
import { logger, ErrorHandler } from './utils';

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
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' })); // Limit request body size

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
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Main Agent4 API endpoint
app.post('/api/agent4/execute', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = executeRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { task, context } = validationResult.data;

    // Reuse shared LLM instance to prevent memory leaks
    const agent = new Agent4Workflow(sharedLLM);
    const result = await agent.run(task, context);

    logger.info('Agent4 execution successful', {
      taskLength: task.length,
      duration: result.metadata.endTime! - result.metadata.startTime,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Agent4 execution error', ErrorHandler.format(error));

    // Use ErrorHandler to create safe response
    const errorResponse = ErrorHandler.toResponse(
      error,
      config.NODE_ENV === 'production'
        ? 'An error occurred while processing your request'
        : undefined
    );

    res.status(errorResponse.statusCode).json({
      success: false,
      error: errorResponse.message,
      details:
        config.NODE_ENV !== 'production'
          ? [{ field: 'execution', message: errorResponse.message }]
          : undefined,
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

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
