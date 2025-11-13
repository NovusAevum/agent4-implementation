import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { config } from './config/index';
import { Agent4Workflow } from './agent4/workflow';

// Initialize Express app
const app = express();
const PORT = config.PORT;

// Request validation schema
const executeRequestSchema = z.object({
  task: z
    .string()
    .min(1, 'Task cannot be empty')
    .max(10000, 'Task is too long (max 10000 characters)'),
  context: z.record(z.unknown()).optional().default({}),
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit request body size

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

    const agent = new Agent4Workflow();
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
    });
  }
});

// Start the server
app.listen(PORT, () => {
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

export default app;
