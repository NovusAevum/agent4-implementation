import { Agent4Workflow } from '../workflow';
import { FallbackLLM } from '../../llm/fallback';

// Mock the FallbackLLM module
jest.mock('../../llm/fallback');

describe('Agent4Workflow', () => {
  let workflow: Agent4Workflow;
  let mockLLM: jest.Mocked<FallbackLLM>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new workflow instance
    workflow = new Agent4Workflow();

    // Get the mocked LLM instance
    mockLLM = (workflow as any).llm as jest.Mocked<FallbackLLM>;

    // Setup default mock implementations
    mockLLM.generate = jest.fn();
    mockLLM.getActiveProviderName = jest.fn().mockReturnValue('mock-provider');
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      const state = workflow.getState();

      expect(state).toBeDefined();
      expect(state.metadata).toBeDefined();
      expect(state.metadata.startTime).toBeDefined();
      expect(state.metadata.provider).toBe('none'); // Initially 'none' before any updates
      expect(state.metadata.stepsCompleted).toEqual([]);
    });

    it('should create a FallbackLLM instance', () => {
      expect(FallbackLLM).toHaveBeenCalled();
    });
  });

  describe('plan phase', () => {
    it('should execute plan phase successfully', async () => {
      const task = 'Test task';
      const planResult = 'This is a test plan';
      mockLLM.generate.mockResolvedValue(planResult);

      const result = await workflow.plan(task);

      expect(result).toBe(planResult);
      expect(mockLLM.generate).toHaveBeenCalledWith(expect.stringContaining(task), {
        max_tokens: 2000,
      });

      const state = workflow.getState();
      expect(state.plan).toBe(planResult);
      expect(state.metadata.stepsCompleted).toContain('plan');
    });

    it('should include context in the plan prompt', async () => {
      const task = 'Test task';
      const context = { key: 'value' };
      mockLLM.generate.mockResolvedValue('Plan');

      await workflow.plan(task, context);

      expect(mockLLM.generate).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(context, null, 2)),
        expect.any(Object)
      );
    });

    it('should handle errors in plan phase', async () => {
      const task = 'Test task';
      const error = new Error('LLM error');
      mockLLM.generate.mockRejectedValue(error);

      await expect(workflow.plan(task)).rejects.toThrow('Plan phase failed: LLM error');
    });

    it('should handle non-Error exceptions', async () => {
      const task = 'Test task';
      mockLLM.generate.mockRejectedValue('String error');

      await expect(workflow.plan(task)).rejects.toThrow('Plan phase failed: Unknown error');
    });
  });

  describe('discover phase', () => {
    it('should execute discover phase successfully with valid JSON', async () => {
      const discoveryData = { findings: ['finding1', 'finding2'] };
      mockLLM.generate.mockResolvedValue(JSON.stringify(discoveryData));

      // Set up initial plan
      await workflow.plan('Test task');
      const result = await workflow.discover();

      expect(result).toEqual(discoveryData);
      expect(mockLLM.generate).toHaveBeenCalledTimes(2);

      const state = workflow.getState();
      expect(state.discovery).toEqual(discoveryData);
      expect(state.metadata.stepsCompleted).toContain('discover');
    });

    it('should handle non-JSON responses gracefully', async () => {
      const nonJsonResponse = 'This is not JSON';
      mockLLM.generate.mockResolvedValue(nonJsonResponse);

      await workflow.plan('Test task');
      const result = await workflow.discover();

      expect(result).toBe(nonJsonResponse);
    });

    it('should include context in the discover prompt', async () => {
      const context = { data: 'test' };
      mockLLM.generate.mockResolvedValue('{}');

      await workflow.plan('Test task');
      await workflow.discover(context);

      const calls = mockLLM.generate.mock.calls;
      const discoverCall = calls[1][0];
      expect(discoverCall).toContain(JSON.stringify(context, null, 2));
    });

    it('should handle errors in discover phase', async () => {
      const error = new Error('Discovery failed');
      mockLLM.generate.mockResolvedValueOnce('Plan').mockRejectedValueOnce(error);

      await workflow.plan('Test task');
      await expect(workflow.discover()).rejects.toThrow('Discover phase failed: Discovery failed');
    });
  });

  describe('execute phase', () => {
    it('should execute phase successfully with valid JSON', async () => {
      const executionData = { results: ['result1', 'result2'] };
      mockLLM.generate.mockResolvedValue(JSON.stringify(executionData));

      await workflow.plan('Test task');
      await workflow.discover();
      const result = await workflow.execute([{ action: 'test' }]);

      expect(result).toEqual(executionData);

      const state = workflow.getState();
      expect(state.execution).toEqual(executionData);
      expect(state.metadata.stepsCompleted).toContain('execute');
    });

    it('should handle actions parameter', async () => {
      const actions = [{ action: 'action1' }, { action: 'action2' }];
      mockLLM.generate.mockResolvedValue('{}');

      await workflow.plan('Test task');
      await workflow.discover();
      await workflow.execute(actions);

      const calls = mockLLM.generate.mock.calls;
      const executeCall = calls[2][0];
      expect(executeCall).toContain(JSON.stringify(actions, null, 2));
    });

    it('should use default empty array for actions if not provided', async () => {
      mockLLM.generate.mockResolvedValue('{}');

      await workflow.plan('Test task');
      await workflow.discover();
      await workflow.execute();

      expect(mockLLM.generate).toHaveBeenCalledWith(expect.stringContaining('[]'), {
        max_tokens: 3000,
      });
    });

    it('should handle errors in execute phase', async () => {
      const error = new Error('Execution failed');
      mockLLM.generate
        .mockResolvedValueOnce('Plan')
        .mockResolvedValueOnce('{}')
        .mockRejectedValueOnce(error);

      await workflow.plan('Test task');
      await workflow.discover();
      await expect(workflow.execute()).rejects.toThrow('Execute phase failed: Execution failed');
    });
  });

  describe('validate phase', () => {
    it('should execute validate phase successfully', async () => {
      const validationData = { status: 'success', issues: [] };
      mockLLM.generate.mockResolvedValue(JSON.stringify(validationData));

      await workflow.plan('Test task');
      await workflow.discover();
      await workflow.execute();
      const result = await workflow.validate();

      expect(result).toEqual(validationData);

      const state = workflow.getState();
      expect(state.validation).toEqual(validationData);
      expect(state.metadata.stepsCompleted).toContain('validate');
      expect(state.metadata.endTime).toBeDefined();
    });

    it('should set endTime in metadata', async () => {
      mockLLM.generate.mockResolvedValue('{}');

      await workflow.plan('Test task');
      await workflow.discover();
      await workflow.execute();

      const beforeTime = Date.now();
      await workflow.validate();
      const afterTime = Date.now();

      const state = workflow.getState();
      expect(state.metadata.endTime).toBeGreaterThanOrEqual(beforeTime);
      expect(state.metadata.endTime).toBeLessThanOrEqual(afterTime);
    });

    it('should handle errors in validate phase', async () => {
      const error = new Error('Validation failed');
      mockLLM.generate
        .mockResolvedValueOnce('Plan')
        .mockResolvedValueOnce('{}')
        .mockResolvedValueOnce('{}')
        .mockRejectedValueOnce(error);

      await workflow.plan('Test task');
      await workflow.discover();
      await workflow.execute();
      await expect(workflow.validate()).rejects.toThrow('Validate phase failed: Validation failed');
    });
  });

  describe('run - full workflow', () => {
    it('should execute all phases in sequence', async () => {
      mockLLM.generate
        .mockResolvedValueOnce('Plan result')
        .mockResolvedValueOnce('{"discovery": "data"}')
        .mockResolvedValueOnce('{"execution": "data"}')
        .mockResolvedValueOnce('{"validation": "data"}');

      const task = 'Complete task';
      const context = { environment: 'test' };
      const result = await workflow.run(task, context);

      expect(mockLLM.generate).toHaveBeenCalledTimes(4);
      expect(result.plan).toBe('Plan result');
      expect(result.discovery).toEqual({ discovery: 'data' });
      expect(result.execution).toEqual({ execution: 'data' });
      expect(result.validation).toEqual({ validation: 'data' });
      expect(result.metadata.stepsCompleted).toEqual(['plan', 'discover', 'execute', 'validate']);
      expect(result.metadata.endTime).toBeDefined();
    });

    it('should propagate errors from any phase', async () => {
      const error = new Error('Phase failed');
      mockLLM.generate.mockRejectedValue(error);

      await expect(workflow.run('Test task')).rejects.toThrow();
    });
  });

  describe('getState', () => {
    it('should return current workflow state', () => {
      const state = workflow.getState();

      expect(state).toBeDefined();
      expect(state.metadata).toBeDefined();
    });

    it('should return updated state after operations', async () => {
      mockLLM.generate.mockResolvedValue('Plan');

      await workflow.plan('Test task');
      const state = workflow.getState();

      expect(state.plan).toBe('Plan');
      expect(state.metadata.stepsCompleted).toContain('plan');
    });
  });

  describe('state management', () => {
    it('should track provider name in metadata', async () => {
      mockLLM.getActiveProviderName.mockReturnValue('test-provider');
      mockLLM.generate.mockResolvedValue('Plan');

      await workflow.plan('Test task');
      const state = workflow.getState();

      expect(state.metadata.provider).toBe('test-provider');
    });

    it('should not add duplicate steps to stepsCompleted', async () => {
      mockLLM.generate.mockResolvedValue('Plan');

      await workflow.plan('Task 1');
      await workflow.plan('Task 2');

      const state = workflow.getState();
      const planSteps = state.metadata.stepsCompleted.filter((step) => step === 'plan');
      expect(planSteps.length).toBe(1);
    });

    it('should preserve previous state when updating', async () => {
      mockLLM.generate.mockResolvedValue('Result');

      await workflow.plan('Test task');
      const startTime = workflow.getState().metadata.startTime;

      await workflow.discover();

      const state = workflow.getState();
      expect(state.metadata.startTime).toBe(startTime);
      expect(state.plan).toBe('Result');
      expect(state.discovery).toBe('Result');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', async () => {
      const jsonData = { test: 'data' };
      mockLLM.generate.mockResolvedValue(JSON.stringify(jsonData));

      await workflow.plan('Test task');
      const result = await workflow.discover();

      expect(result).toEqual(jsonData);
    });

    it('should return original string for invalid JSON', async () => {
      const invalidJson = 'not valid json {';
      mockLLM.generate.mockResolvedValue(invalidJson);

      await workflow.plan('Test task');
      const result = await workflow.discover();

      expect(result).toBe(invalidJson);
    });

    it('should handle empty strings in JSON parsing', async () => {
      // Plan must return non-empty string to pass validation
      mockLLM.generate.mockResolvedValueOnce('Test plan');
      // Discover can return empty string to test JSON parsing
      mockLLM.generate.mockResolvedValueOnce('');

      await workflow.plan('Test task');
      const result = await workflow.discover();

      expect(result).toBe('');
    });
  });
});
