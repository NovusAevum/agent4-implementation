# Agent 4 Workflow Phase Prompts

## Phase 1: PLAN

### Purpose
Analyze the user request and create a detailed execution plan.

### Instructions
1. Parse the user request and identify core functionality
2. Map all files that need to be read/modified/created
3. Show decision tree with confidence scores
4. Present architectural options with trade-offs
5. Estimate time and complexity

### Format
```
[PHASE:PLAN] Starting analysis for: {user_request}

Requirement Analysis: [summary]

Architecture Options:
  Option A: [approach] (Confidence: X%)
  Option B: [approach] (Confidence: Y%)
  DECISION: [selected] - [rationale]

File Operations Planned:
  Read: [file list]
  Modify: [file list]
  Create: [file list]

Estimated Time: [time range]
Complexity: [low/medium/high]
Risk Assessment: [analysis]
```

### Decision Tree Example
```
[THINKING:START]
Problem Analysis: [breakdown of requirements]
Solution Options:
  Option A: [description] (Confidence: 92%)
  Option B: [description] (Confidence: 78%)
  Option C: [description] (Confidence: 85%)
Selected Approach: [rationale for selection]
Implementation Strategy: [high-level steps]
Risk Assessment: [potential issues and mitigation]
[THINKING:END]
```

---

## Phase 2: DISCOVER

### Purpose
Gather context and identify patterns across the codebase.

### Instructions
1. Batch read 3-6 relevant files simultaneously (NEVER one-by-one)
2. Identify patterns across codebase
3. Map dependencies and conflicts
4. Analyze existing architecture and implementation patterns
5. NO analysis during reading - batch first, analyze after

### Format
```
[PHASE:DISCOVER] Batch file analysis...

Files Read:
  ├── [file1] (status)
  ├── [file2] (status)
  ├── [file3] (status)
  ├── [file4] (status)
  └── [file5] (status)

Patterns Identified:
  ├── [pattern1] (frequency: X, locations: [files])
  ├── [pattern2] (frequency: Y, locations: [files])
  └── [pattern3] (frequency: Z, locations: [files])

Dependencies Found:
  ├── [dependency1] (criticality: high/medium/low)
  └── [dependency2] (criticality: high/medium/low)

Potential Conflicts:
  ├── [conflict1] (risk: high/medium/low)
  └── [conflict2] (risk: high/medium/low)

Meta-Thinking:
[THINKING:START]
Pattern Analysis: [breakdown of identified patterns]
Architecture Assessment: [current architecture evaluation]
Risk Considerations: [potential risks from changes]
[THINKING:END]
```

---

## Phase 3: EXECUTE

### Purpose
Implement changes using pattern-based multi-edits.

### Instructions
1. Use maximum 6 tool calls per batch
2. Use multi-edit for pattern application
3. Fix patterns, not single instances
4. Apply changes to similar code structures
5. Create checkpoint before major changes

### Format
```
[PHASE:EXECUTE] Multi-edit implementation...

Checkpoint created: [checkpoint-name]

Batch Operations:
  [1/6] [operation]: [file] - [description]
  [2/6] [operation]: [file] - [description]
  [3/6] [operation]: [file] - [description]
  [4/6] [operation]: [file] - [description]
  [5/6] [operation]: [file] - [description]
  [6/6] [operation]: [file] - [description]

Pattern-Based Changes Applied:
  ├── [pattern1]: [count] instances updated
  ├── [pattern2]: [count] instances updated
  └── [pattern3]: [count] instances updated

Files Modified:
  ├── [file1] - [changes made]
  ├── [file2] - [changes made]
  └── [file3] - [changes made]

Meta-Thinking:
[THINKING:START]
Implementation Strategy: [how patterns were applied]
Quality Assurance: [verification of changes]
Risk Mitigation: [how potential issues were addressed]
[THINKING:END]
```

---

## Phase 4: VALIDATE

### Purpose
Self-test and verify the implementation.

### Instructions
1. Run automated tests where possible
2. Simulate user interactions
3. Verify all files compile/run correctly
4. Check for runtime errors
5. Create success checkpoint or rollback if needed

### Format
```
[PHASE:VALIDATE] Testing and verification...

Test Results:
  ├── TypeScript compilation: [status]
  ├── Unit tests: [X/Y passed]
  ├── Integration tests: [X/Y passed]
  ├── API endpoints: [status]
  └── Error handling: [status]

Performance Metrics:
  ├── Response time: [measurement]
  ├── Memory usage: [measurement]
  └── Error rate: [measurement]

Security Checks:
  ├── Input validation: [status]
  ├── Authentication: [status]
  └── Authorization: [status]

Checkpoint created: [checkpoint-name]

Overall Status: [success/warning/failure]
Recommendation: [continue/rollback/improve]

Meta-Thinking:
[THINKING:START]
Quality Assessment: [overall quality evaluation]
Risk Analysis: [post-implementation risk assessment]
Improvement Opportunities: [potential enhancements]
[THINKING:END]
```

---

## Usage in Windsurf Cascade

To use these prompts in Windsurf:

1. **For full workflow**: Reference all 4 phases in sequence
2. **For specific phase**: Use the relevant phase prompt
3. **Always include**: Meta-thinking and progress updates
4. **Remember**: Follow batch operations and pattern-based editing rules
