import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { Agent4Workflow } from './agent4/workflow';

// Initialize Express app
const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());

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
  const { task, context = {} } = req.body;
  
  if (!task) {
    res.status(400).json({
      success: false,
      error: 'Task is required',
    });
    return;
  }

  try {
    const agent = new Agent4Workflow();
    const result = await agent.run(task, context);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Agent4 execution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
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
