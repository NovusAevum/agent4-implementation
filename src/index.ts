import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from './config/index';
import { Agent4Workflow } from './agent4/workflow';
import { FallbackLLM } from './llm/fallback';

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

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Agent4 execution error:', error);
    // Don't expose internal error details in production
    const errorMessage =
      config.NODE_ENV === 'production'
        ? 'An error occurred while processing your request'
        : error instanceof Error
          ? error.message
          : 'Internal server error';

    res.status(500).json({
      success: false,
      error: errorMessage,
      details:
        config.NODE_ENV !== 'production' && error instanceof Error
          ? [{ field: 'execution', message: error.message }]
          : undefined,
    });
  }
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Agent4 server is running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Available at: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

/**
 * Graceful shutdown handler
 * Properly closes server and cleans up resources
 */
function gracefulShutdown(signal: string) {
  console.log(`${signal} received, starting graceful shutdown...`);

  server.close(() => {
    console.log('HTTP server closed');
    sharedLLM.destroy();
    console.log('Resources cleaned up');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
