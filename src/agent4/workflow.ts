import { FallbackLLM } from '../llm/fallback';

export type WorkflowPhase = 'plan' | 'discover' | 'execute' | 'validate';

/**
 * Discovery result type
 */
export type DiscoveryResult = {
  findings?: string;
  resources?: string[];
  missingInfo?: string[];
  [key: string]: unknown;
};

/**
 * Execution result type
 */
export type ExecutionResult = {
  results?: string[];
  errors?: string[];
  status?: string;
  [key: string]: unknown;
};

/**
 * Validation result type
 */
export type ValidationResult = {
  isValid?: boolean;
  errors?: string[];
  warnings?: string[];
  report?: string;
  [key: string]: unknown;
};

/**
 * Checkpoint type for workflow state snapshots
 */
export type Checkpoint = {
  id: string;
  timestamp: number;
  phase: WorkflowPhase;
  state: Partial<WorkflowState>;
};

/**
 * Complete workflow state
 */
export type WorkflowState = {
  plan?: string;
  discovery?: DiscoveryResult | string;
  execution?: ExecutionResult | string;
  validation?: ValidationResult | string;
  metadata: {
    startTime: number;
    endTime?: number;
    provider: string;
    stepsCompleted: string[];
  };
  metaThinking?: {
    decisionTree?: Record<string, unknown>;
    confidenceScores?: Record<string, number>;
    tradeoffs?: string[];
  };
  checkpoints?: Checkpoint[];
};

export class Agent4Workflow {
  private llm: FallbackLLM;
  private state: WorkflowState;

  constructor(llm?: FallbackLLM) {
    // Use injected LLM or create new one (for testing/backward compatibility)
    this.llm = llm || new FallbackLLM();
    this.state = {
      metadata: {
        startTime: Date.now(),
        provider: 'none',
        stepsCompleted: [],
      },
    };
  }

  private async updateState(updates: Partial<WorkflowState>) {
    this.state = {
      ...this.state,
      ...updates,
      metadata: {
        ...this.state.metadata,
        ...(updates.metadata || {}),
        provider: this.llm.getActiveProviderName(),
      },
    };
  }

  private addCompletedStep(step: string) {
    if (!this.state.metadata.stepsCompleted.includes(step)) {
      this.state.metadata.stepsCompleted.push(step);
    }
  }

  async plan(task: string, context: Record<string, unknown> = {}): Promise<string> {
    try {
      const prompt = `You are Agent 4, an advanced AI assistant. 

TASK: ${task}

CONTEXT:
${JSON.stringify(context, null, 2)}

PLAN PHASE:
1. Analyze the task requirements
2. Break down the task into clear steps
3. Identify potential challenges and solutions
4. Provide a detailed plan of action

PLAN:`;

      const plan = await this.llm.generate(prompt, { max_tokens: 2000 });
      await this.updateState({ plan });
      this.addCompletedStep('plan');
      return plan;
    } catch (error) {
      console.error('Error in plan phase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Plan phase failed: ${errorMessage}`);
    }
  }

  async discover(context: Record<string, unknown> = {}): Promise<DiscoveryResult | string> {
    // Validate that plan phase completed
    if (!this.state.plan || this.state.plan.trim() === '') {
      throw new Error('Cannot run discover phase: plan phase not completed');
    }

    try {
      const prompt = `You are Agent 4 in DISCOVERY phase.

TASK: ${this.state.plan}

EXISTING CONTEXT:
${JSON.stringify(context, null, 2)}

DISCOVERY PHASE:
1. Analyze available information
2. Identify missing information
3. Determine required resources
4. Outline discovery findings

Provide a structured JSON response with your findings.`;

      const discovery = await this.llm.generate(prompt, { max_tokens: 2000 });
      const parsedDiscovery = this.safeJsonParse(discovery);
      await this.updateState({ discovery: parsedDiscovery });
      this.addCompletedStep('discover');
      return parsedDiscovery;
    } catch (error) {
      console.error('Error in discover phase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Discover phase failed: ${errorMessage}`);
    }
  }

  async execute(actions: Record<string, unknown>[] = []): Promise<ExecutionResult | string> {
    // Validate that previous phases completed
    if (!this.state.plan || this.state.plan.trim() === '') {
      throw new Error('Cannot run execute phase: plan phase not completed');
    }
    if (!this.state.discovery) {
      throw new Error('Cannot run execute phase: discover phase not completed');
    }

    try {
      const prompt = `You are Agent 4 in EXECUTION phase.

TASK: ${this.state.plan}

DISCOVERY FINDINGS:
${JSON.stringify(this.state.discovery, null, 2)}

ACTIONS TO EXECUTE:
${JSON.stringify(actions, null, 2)}

EXECUTION PHASE:
1. Execute the planned actions
2. Handle any errors or edge cases
3. Document the execution results

Provide a structured JSON response with the execution results.`;

      const execution = await this.llm.generate(prompt, { max_tokens: 3000 });
      const parsedExecution = this.safeJsonParse(execution);
      await this.updateState({ execution: parsedExecution });
      this.addCompletedStep('execute');
      return parsedExecution;
    } catch (error) {
      console.error('Error in execute phase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Execute phase failed: ${errorMessage}`);
    }
  }

  async validate(): Promise<ValidationResult | string> {
    // Validate that previous phases completed
    if (!this.state.plan || this.state.plan.trim() === '') {
      throw new Error('Cannot run validate phase: plan phase not completed');
    }
    if (!this.state.discovery) {
      throw new Error('Cannot run validate phase: discover phase not completed');
    }
    if (!this.state.execution) {
      throw new Error('Cannot run validate phase: execute phase not completed');
    }

    try {
      const prompt = `You are Agent 4 in VALIDATION phase.

TASK: ${this.state.plan}

EXECUTION RESULTS:
${JSON.stringify(this.state.execution, null, 2)}

VALIDATION PHASE:
1. Verify all requirements are met
2. Check for errors or issues
3. Validate the quality of the results
4. Provide a validation report

Provide a structured JSON response with the validation results.`;

      const validation = await this.llm.generate(prompt, { max_tokens: 2000 });
      const parsedValidation = this.safeJsonParse(validation);

      await this.updateState({
        validation: parsedValidation,
        metadata: {
          ...this.state.metadata,
          endTime: Date.now(),
        },
      });

      this.addCompletedStep('validate');
      return parsedValidation;
    } catch (error) {
      console.error('Error in validate phase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Validate phase failed: ${errorMessage}`);
    }
  }

  async run(task: string, context: Record<string, unknown> = {}): Promise<WorkflowState> {
    try {
      await this.plan(task, context);
      await this.discover(context);
      await this.execute([{ task }]);
      await this.validate();

      return this.getState();
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    }
  }

  getState(): WorkflowState {
    return this.state;
  }

  private safeJsonParse(jsonString: string): Record<string, unknown> | string {
    try {
      return JSON.parse(jsonString) as Record<string, unknown>;
    } catch (e) {
      // If parsing fails, return the original string
      return jsonString;
    }
  }
}
