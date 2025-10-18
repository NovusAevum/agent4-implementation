# Agent 4 Quick Reference Card

## 🎯 4-Phase Workflow

```
PLAN → DISCOVER → EXECUTE → VALIDATE
```

### Phase Markers
```
[PHASE:PLAN] Starting analysis...
[PHASE:DISCOVER] Batch file analysis...
[PHASE:EXECUTE] Multi-edit implementation...
[PHASE:VALIDATE] Testing and verification...
```

---

## 🧠 Meta-Thinking Template

```
[THINKING:START]
├── Problem Analysis: [breakdown]
├── Solution Options: [with confidence scores]
├── Selected Approach: [rationale]
├── Implementation Strategy: [steps]
└── Risk Assessment: [analysis]
[THINKING:END]
```

---

## 📊 Progress Updates

```
[PROGRESS] Phase X/4: [PHASE_NAME] (X% complete)
[STATUS] [current operation]
[FILE] [operation]: [filepath]
[BATCH] [operation]: [file count] files
[DECISION] [decision made] - [rationale]
[CONFIDENCE] X% - [reasoning]
```

---

## 📋 Phase Checklists

### PLAN Phase
- [ ] Parse user request
- [ ] Map files (read/modify/create)
- [ ] Show decision tree
- [ ] Present options with confidence scores
- [ ] Estimate time and complexity

### DISCOVER Phase
- [ ] Batch read 3-6 files
- [ ] Identify patterns
- [ ] Map dependencies
- [ ] Detect conflicts
- [ ] NO analysis during reading

### EXECUTE Phase
- [ ] Create checkpoint
- [ ] Maximum 6 tool calls
- [ ] Use multi-edit
- [ ] Apply pattern-based changes
- [ ] Maintain consistency

### VALIDATE Phase
- [ ] Run tests
- [ ] Verify compilation
- [ ] Check runtime errors
- [ ] Create success checkpoint
- [ ] Summarize results

---

## 🔧 Core Rules

### Batch Operations
```
✅ Read [file1, file2, file3, file4] in parallel
❌ Read file1, then file2, then file3, then file4
```

### Pattern-Based Editing
```
✅ Apply pattern "update all API endpoints" across 5 files
❌ Update endpoint in file1, then file2, then file3...
```

### Constructive Feedback
```
✅ "Have you considered..."
✅ "An alternative approach..."
❌ "This is wrong"
❌ "You should"
```

---

## 💬 Example Prompts

### Full Workflow
```
Using Agent 4 protocol, create a REST API with:
- User authentication (JWT)
- CRUD operations
- Input validation
- Error handling
```

### Plan Only
```
Execute only the PLAN phase for: Migrate database from MongoDB to PostgreSQL
```

### Discover Only
```
Run DISCOVER phase to analyze the current authentication implementation
```

### Execute Only
```
EXECUTE phase: Apply the planned refactoring to the user service
```

### Validate Only
```
VALIDATE phase: Test the new authentication system
```

---

## 🎯 Decision Tree Example

```
[THINKING:START]
Problem: Implement user authentication

Options:
├── A: JWT + Redis (Confidence: 92%)
│   ├── Pros: Scalable, stateless, fast
│   ├── Cons: Redis dependency
│   └── Risk: Medium
├── B: Session-based (Confidence: 75%)
│   ├── Pros: Simple, proven
│   ├── Cons: Not scalable
│   └── Risk: Low
└── C: OAuth only (Confidence: 68%)
    ├── Pros: Secure, delegated
    ├── Cons: Complex, external dependency
    └── Risk: High

Selected: A (JWT + Redis)
Rationale: Best balance of security, performance, and scalability

Implementation:
1. Install dependencies (jsonwebtoken, redis)
2. Create auth service
3. Implement middleware
4. Add refresh token rotation
5. Setup rate limiting

Risks:
├── Redis connection failure → Fallback to in-memory
├── Token expiration → Refresh token mechanism
└── Rate limiting bypass → IP-based + user-based limits
[THINKING:END]
```

---

## 📁 File Operations Format

```
File Operations Planned:
  Read: [file1.ts, file2.ts, file3.ts]
  Modify: [file4.ts, file5.ts]
  Create: [file6.ts, file7.ts]
  Delete: [file8.ts]
```

---

## ✅ Checkpoint Format

```
Checkpoint created: checkpoint-[phase]-[timestamp]

Examples:
- checkpoint-plan-20241018-234500
- checkpoint-discover-20241018-234600
- checkpoint-execute-20241018-234700
- checkpoint-validate-20241018-234800
```

---

## 🔄 Batch Operations Examples

### Reading Files
```
[BATCH] Reading: 5 files
Files Read:
  ├── src/auth/auth.service.ts ✓
  ├── src/auth/jwt.util.ts ✓
  ├── src/config/auth.config.ts ✓
  ├── src/middleware/auth.middleware.ts ✓
  └── src/models/user.model.ts ✓
```

### Pattern-Based Edits
```
Pattern-Based Changes Applied:
  ├── JWT middleware: 3 instances updated
  ├── Error handlers: 5 instances updated
  ├── Config imports: 4 instances updated
  └── Type definitions: 2 instances updated
```

---

## 🧪 Validation Format

```
Test Results:
  ├── TypeScript compilation: ✓ PASS
  ├── Unit tests: 12/12 passed ✓
  ├── Integration tests: 5/5 passed ✓
  ├── API endpoints: All responding ✓
  └── Error handling: Validated ✓

Performance Metrics:
  ├── Response time: <100ms ✓
  ├── Memory usage: 45MB ✓
  └── Error rate: 0% ✓

Security Checks:
  ├── Input validation: ✓ PASS
  ├── Authentication: ✓ PASS
  └── Authorization: ✓ PASS

Overall Status: ✅ SUCCESS
Recommendation: Deploy to production
```

---

## 🚀 Quick Commands

### Invoke Agent 4
```
Using Agent 4 protocol, [your task]
```

### Request Specific Phase
```
Execute [PLAN/DISCOVER/EXECUTE/VALIDATE] phase for: [task]
```

### Show Meta-Thinking
```
Show your meta-thinking and decision trees for: [task]
```

### Request Batch Operations
```
Use batch operations to analyze [files/components]
```

### Create Checkpoint
```
Create a checkpoint before proceeding
```

### Request Pattern-Based Edit
```
Apply pattern-based edits to fix [pattern] across the codebase
```

---

## 📊 Confidence Scores

```
90-100%: Very High - Proceed with confidence
80-89%:  High - Good solution, minor risks
70-79%:  Medium - Acceptable, some trade-offs
60-69%:  Low - Consider alternatives
<60%:    Very Low - Not recommended
```

---

## 🎨 Status Indicators

```
✅ SUCCESS - Operation completed successfully
⚠️  WARNING - Completed with warnings
❌ FAILURE - Operation failed
🔄 IN PROGRESS - Currently executing
⏸️  PAUSED - Waiting for input
🔍 ANALYZING - Gathering information
```

---

## 🔑 Key Principles

1. **Always follow 4-phase workflow**
2. **Batch operations (3-6 files minimum)**
3. **Pattern-based editing**
4. **Show meta-thinking**
5. **Create checkpoints**
6. **Real-time progress updates**
7. **Constructive feedback**
8. **Maximum autonomy**

---

## 📞 Quick Help

### Not Following Protocol?
→ Explicitly say "Using Agent 4 protocol"

### Files Read One-by-One?
→ Remind: "Use batch operations (3-6 files)"

### No Meta-Thinking?
→ Request: "Show your meta-thinking"

### No Checkpoints?
→ Ask: "Create checkpoints after each phase"

### Pattern Not Applied?
→ Specify: "Use pattern-based multi-edits"

---

## 💡 Pro Tips

1. **Be Specific**: Clearly state requirements
2. **Reference Protocol**: Mention "Agent 4 protocol"
3. **Request Phases**: Can run phases individually
4. **Check Progress**: Ask for status updates
5. **Review Checkpoints**: Can rollback if needed
6. **Validate Thoroughly**: Don't skip VALIDATE phase
7. **Trust the Process**: Let Agent 4 show its work

---

## 📖 Full Documentation

- **[README.md](README.md)** - Overview and quick start
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Complete setup guide
- **[AGENT4_GLOBAL_RULES.md](AGENT4_GLOBAL_RULES.md)** - Core protocol rules
- **[AGENT4_WORKFLOW_PROMPTS.md](AGENT4_WORKFLOW_PROMPTS.md)** - Phase prompts
- **[AGENT4_PROTOCOL_RULES.md](AGENT4_PROTOCOL_RULES.md)** - Detailed rules
- **[MCP_SERVER_CONFIG.md](MCP_SERVER_CONFIG.md)** - MCP setup

---

<div align="center">

**Keep this reference handy for quick Agent 4 protocol usage!** 📌

</div>
