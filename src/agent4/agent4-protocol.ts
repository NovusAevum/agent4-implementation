/**
 * Agent 4 Protocol Implementation
 * Unified configuration combining REPLIT AGENT 3 ENHANCED and enterprise capabilities
 *
 * Core Philosophy: Transparent, autonomous, enterprise-grade AI agent
 * Mandatory 4-Phase Workflow: PLAN → DISCOVER → EXECUTE → VALIDATE
 */

export interface Agent4Config {
  name: string;
  version: string;
  capabilities: Agent4Capabilities;
  workflowPhases: WorkflowPhaseConfig;
  behavior: BehaviorConfig;
  metaThinking: MetaThinkingConfig;
  checkpoints: CheckpointConfig;
}

export interface Agent4Capabilities {
  fullStackDevelopment: boolean;
  multiModalUnderstanding: boolean;
  metaThinking: boolean;
  extendedThinking: boolean;
  checkpointSystem: boolean;
  rollbackSupport: boolean;
  realTimeCollaboration: boolean;
  autonomousExecution: boolean;
  livePreview: boolean;
  selfTesting: boolean;
  performanceMonitoring: boolean;
  batchOperations: boolean;
  patternBasedEdits: boolean;
  intelligentCompletion: boolean;
  securityScanning: boolean;
  osintRecon: boolean;
  devOpsAutomation: boolean;
  contextAwareness: boolean;
  mcpIntegration: boolean;
  webBrowsing: boolean;
  apiIntegration: boolean;
}

export interface WorkflowPhaseConfig {
  enabled: boolean;
  phases: ['PLAN', 'DISCOVER', 'EXECUTE', 'VALIDATE'];
  requireApproval: boolean;
  maxToolCallsPerBatch: number;
  batchOperations: boolean;
}

export interface BehaviorConfig {
  showRealTimeProgress: boolean;
  showClickableLinks: boolean;
  showDecisionTrees: boolean;
  showFileOperations: boolean;
  showInternalState: boolean;
  chronologicalFeed: boolean;
  constructiveFeedback: boolean;
  autonomy: {
    maxAutonomy: boolean;
    longRunning: boolean;
    selfCorrection: boolean;
    userIntervention: boolean;
    transparentOperations: boolean;
  };
}

export interface MetaThinkingConfig {
  enabled: boolean;
  extendedMode: boolean;
  showDecisionTrees: boolean;
  showConfidenceScores: boolean;
  showTradeoffs: boolean;
}

export interface CheckpointConfig {
  enabled: boolean;
  autoCreate: boolean;
  afterMajorChanges: boolean;
  supportRollback: boolean;
}

export interface PhaseResult {
  phase: 'PLAN' | 'DISCOVER' | 'EXECUTE' | 'VALIDATE';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  output: any;
  metadata: {
    startTime: number;
    endTime?: number;
    duration?: number;
    confidence?: number;
    decisionTree?: any;
  };
}

export interface Agent4Response {
  success: boolean;
  workflow: {
    phases: PhaseResult[];
    totalDuration: number;
    provider: string;
    fallbackUsed: boolean;
  };
  metaThinking?: {
    decisionTree: any;
    confidenceScores: Record<string, number>;
    tradeoffs: string[];
  };
  checkpoint?: {
    id: string;
    timestamp: number;
    state: any;
  };
  data?: any;
  error?: string;
}

export const AGENT4_DEFAULT_CONFIG: Agent4Config = {
  name: 'agent-4-multi-llm',
  version: '1.0.0',
  capabilities: {
    fullStackDevelopment: true,
    multiModalUnderstanding: true,
    metaThinking: true,
    extendedThinking: true,
    checkpointSystem: true,
    rollbackSupport: true,
    realTimeCollaboration: true,
    autonomousExecution: true,
    livePreview: true,
    selfTesting: true,
    performanceMonitoring: true,
    batchOperations: true,
    patternBasedEdits: true,
    intelligentCompletion: true,
    securityScanning: true,
    osintRecon: true,
    devOpsAutomation: true,
    contextAwareness: true,
    mcpIntegration: true,
    webBrowsing: true,
    apiIntegration: true,
  },
  workflowPhases: {
    enabled: true,
    phases: ['PLAN', 'DISCOVER', 'EXECUTE', 'VALIDATE'],
    requireApproval: false,
    maxToolCallsPerBatch: 6,
    batchOperations: true,
  },
  behavior: {
    showRealTimeProgress: true,
    showClickableLinks: true,
    showDecisionTrees: true,
    showFileOperations: true,
    showInternalState: true,
    chronologicalFeed: true,
    constructiveFeedback: true,
    autonomy: {
      maxAutonomy: true,
      longRunning: true,
      selfCorrection: true,
      userIntervention: true,
      transparentOperations: true,
    },
  },
  metaThinking: {
    enabled: true,
    extendedMode: true,
    showDecisionTrees: true,
    showConfidenceScores: true,
    showTradeoffs: true,
  },
  checkpoints: {
    enabled: true,
    autoCreate: true,
    afterMajorChanges: true,
    supportRollback: true,
  },
};

/**
 * Agent 4 System Prompt
 * Integrates all capabilities and enforces 4-phase workflow
 */
export const AGENT4_SYSTEM_PROMPT = `You are Agent 4, the most advanced unified AI engineering agent.

## CORE IDENTITY
- Enterprise-grade autonomous engineering agent
- Merge of REPLIT AGENT 3 ENHANCED + enterprise capabilities
- Maximum intelligence, capability, safety, and transparency

## MANDATORY 4-PHASE WORKFLOW
Every operation MUST follow this sequence:

### Phase 1: PLAN
[PHASE:PLAN] Starting analysis...
1. Parse user request and identify core functionality
2. Map all files that need to be read/modified/created
3. Show decision tree with confidence scores
4. Present architectural options with trade-offs
5. Get user approval (if required)

DISPLAY FORMAT:
├── Requirement Analysis: [summary]
├── Architecture Options:
│   ├── Option A: [approach] (Confidence: X%)
│   ├── Option B: [approach] (Confidence: Y%)
│   └── DECISION: [selected] - [rationale]
├── File Operations Planned:
│   ├── Read: [file list]
│   ├── Modify: [file list]
│   └── Create: [file list]
└── User Approval: [status]

### Phase 2: DISCOVER
[PHASE:DISCOVER] Batch file analysis...
RULES:
- Read 3-6 files simultaneously (NEVER one-by-one)
- Identify patterns across codebase
- Map dependencies and conflicts
- NO analysis during reading - batch first, analyze after

### Phase 3: EXECUTE
[PHASE:EXECUTE] Multi-edit implementation...
RULES:
- Maximum 6 tool calls per batch
- Use multi-edit for pattern application
- Fix patterns, not single instances
- Apply changes to similar code structures

### Phase 4: VALIDATE
[PHASE:VALIDATE] Testing and verification...
RULES:
- Self-test implementation when possible
- Create checkpoint after successful validation
- Stop and summarize on success
- Show validation results clearly

## META-THINKING
Always show your reasoning:
[THINKING:START]
├── Problem Analysis: [breakdown]
├── Solution Options: [with confidence scores]
├── Selected Approach: [rationale]
├── Implementation Strategy: [steps]
└── Risk Assessment: [analysis]
[THINKING:END]

## REAL-TIME PROGRESS
Continuously update status:
[PROGRESS] Phase X/4: [PHASE_NAME] (X% complete)
[STATUS] [current operation]
[FILE] [operation]: [filepath]
[BATCH] [operation]: [file count] files
[DECISION] [decision made] - [rationale]
[CONFIDENCE] X% - [reasoning]

## BATCH OPERATIONS
- NEVER read files one-by-one
- Always batch 3-6 files minimum
- Group related operations
- Minimize redundant calls

## MULTI-LLM FALLBACK
- Primary: Hugging Face
- Fallback order: Mistral → DeepSeek → OpenRouter → Codestral
- Auto-switch on failure
- Show provider used

## CHECKPOINTS
- Auto-create after each phase
- Support rollback to any checkpoint
- Include full state snapshot

## CONSTRUCTIVE FEEDBACK
- Use: "Have you considered...", "An alternative approach..."
- Never: "This is wrong", "You should"
- Always explain the "why"

## SUCCESS CRITERIA
- All phases completed successfully
- Self-tests passing
- Checkpoint created
- User requirements met
- No errors in validation

Remember: You are a trusted technical partner. Be transparent, show your work, and deliver enterprise-grade solutions.`;

export default AGENT4_DEFAULT_CONFIG;
