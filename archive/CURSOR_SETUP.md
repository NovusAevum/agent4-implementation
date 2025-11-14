# 🖱️ Cursor IDE - Agent 4 Integration Guide

## ✅ Installation (3 Steps)

### Step 1: Start Agent 4 Server
```bash
cd /Users/wmh/CascadeProjects/agent4-implementation
npm start
```

### Step 2: Install Cursor Extension
1. Open Cursor IDE
2. Go to Extensions (`Cmd+Shift+X`)
3. Search for "Custom AI Agent"
4. Install and reload

### Step 3: Configure Agent 4
1. Open Settings (`Cmd+,`)
2. Search for "AI Agent"
3. Add custom agent configuration:

```json
{
  "ai.customAgent": {
    "name": "Agent 4 Multi-LLM",
    "endpoint": "http://localhost:3000/api/agent4/execute",
    "configPath": "/Users/wmh/CascadeProjects/agent4-implementation/.cursor/agent4-config.json"
  }
}
```

## 🎯 Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Ask Agent | `Cmd+K` | Open Agent 4 chat |
| Code Action | `Cmd+.` | Agent 4 suggestions |
| Explain Code | `Cmd+Shift+E` | Detailed explanation |
| Refactor | `Cmd+Shift+R` | Smart refactoring |
| Generate Tests | `Cmd+Shift+T` | Auto-generate tests |

## 💡 Usage Patterns

### Pattern 1: Code Completion
Type code and Agent 4 auto-completes with context-aware suggestions:

```typescript
// Type: "function authenticate"
// Agent 4 completes:
async function authenticateUser(credentials: UserCredentials): Promise<AuthResult> {
  try {
    // Validate credentials
    if (!credentials.username || !credentials.password) {
      throw new Error('Missing credentials');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    
    // Generate JWT
    const token = jwt.sign(
      { username: credentials.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return { success: true, token };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```

### Pattern 2: Chat-Driven Development

**You:** "Create a CRUD API for blog posts"

**Agent 4:**
```
[PHASE:PLAN] Analyzing requirements...

I'll create a RESTful CRUD API for blog posts with these features:
- GET /posts (list all)
- GET /posts/:id (get one)
- POST /posts (create)
- PUT /posts/:id (update)
- DELETE /posts/:id (delete)

Architecture Decision:
├── Express router for routes
├── Mongoose for MongoDB
├── Input validation with Joi
├── Error handling middleware
└── OpenAPI documentation

Files to create:
1. src/models/Post.ts
2. src/controllers/postController.ts
3. src/routes/postRoutes.ts
4. src/middleware/validation.ts

Proceeding with implementation...

[PHASE:DISCOVER] Reading existing files...
[PHASE:EXECUTE] Creating CRUD operations...
[PHASE:VALIDATE] Self-testing endpoints...

✅ All tests passed! Created checkpoint: blog-crud-v1
```

### Pattern 3: Code Explanation

Select code → Press `Cmd+Shift+E`:

**Agent 4 explains:**
```
[THINKING:START]
This code implements a JWT authentication middleware.

Flow Analysis:
1. Extracts token from Authorization header
2. Verifies token signature using JWT_SECRET
3. Decodes user payload
4. Attaches user to request object
5. Proceeds to next middleware if valid

Security Considerations:
- ✓ Validates token signature
- ✓ Checks expiration
- ✓ Uses environment variable for secret
- ⚠️ Consider adding rate limiting
- ⚠️ Consider refresh token rotation

Performance: O(1) - Efficient token verification
[THINKING:END]
```

### Pattern 4: Smart Refactoring

Right-click code → "Refactor with Agent 4":

```typescript
// Before (nested callbacks):
function processData(data, callback) {
  validateData(data, function(err, valid) {
    if (err) return callback(err);
    transformData(valid, function(err, transformed) {
      if (err) return callback(err);
      saveData(transformed, function(err, result) {
        if (err) return callback(err);
        callback(null, result);
      });
    });
  });
}

// After (async/await):
async function processData(data: DataInput): Promise<DataOutput> {
  const validated = await validateData(data);
  const transformed = await transformData(validated);
  const result = await saveData(transformed);
  return result;
}
```

**Agent 4 shows reasoning:**
```
[DECISION:REFACTOR]
Confidence: 95%

Changes:
- Convert callbacks to async/await
- Add TypeScript types
- Improve error handling
- Reduce nesting (callback hell → flat)

Benefits:
- Better readability: 70% less code complexity
- Type safety: Catches errors at compile time
- Error handling: Try/catch instead of error callbacks
- Maintainability: Easier to debug and test
```

## 🔥 Advanced Features

### Multi-File Edits
Agent 4 can edit multiple files in one operation:

```
You: "Add logging to all API endpoints"

Agent 4:
[BATCH:EDIT] Applying logging pattern to 12 files...
├── src/routes/userRoutes.ts
├── src/routes/postRoutes.ts
├── src/routes/authRoutes.ts
└── ... 9 more files

Pattern Applied:
- Import winston logger
- Add request logging middleware
- Log errors with stack traces
- Add response time tracking
```

### Context-Aware Suggestions
Agent 4 understands your project:

```typescript
// It knows you're using:
// - Express.js
// - TypeScript
// - MongoDB
// - Jest for testing

// So it suggests compatible code:
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import logger from '../utils/logger';

// Instead of vanilla JavaScript
```

### Self-Testing
Agent 4 validates its own code:

```
[VALIDATE] Running self-tests...
├── ✓ Compiles without errors
├── ✓ Passes all unit tests
├── ✓ No linting errors
├── ✓ API responds as expected
└── ✓ Performance within limits

[CHECKPOINT] Created: feature-complete-v1
```

## 🎨 UI Customization

### Status Bar
Agent 4 shows status in bottom bar:
```
🤖 Agent 4 | Provider: Mistral | Latency: 2.3s | Healthy ✓
```

### Inline Suggestions
```typescript
const user = {
  name: "John",
  email: "john@example.com",
  // Agent 4 suggests:
  // password: await bcrypt.hash(plainPassword, 10),
  // createdAt: new Date(),
  // role: UserRole.USER,
};
```

### Error Highlights
Agent 4 highlights potential issues:
```typescript
async function login(username, password) {
  // ⚠️ Agent 4: Consider adding input validation
  // 💡 Suggestion: Use Joi or Zod for validation
  
  const user = await User.findOne({ username });
  // ⚠️ Agent 4: Handle case when user not found
  
  return jwt.sign({ id: user.id }, SECRET);
  // 🔒 Agent 4: Use environment variable for SECRET
}
```

## 📊 Monitoring Dashboard

Access at: `http://localhost:3000/dashboard`

Shows:
- Active provider
- Response times
- Error rates
- API call statistics
- Checkpoint history

## 🔧 Configuration Options

Edit `.cursor/agent4-config.json`:

```json
{
  "workflowSettings": {
    "enableBatchOperations": true,
    "maxBatchSize": 6,
    "enableCheckpoints": true,
    "enableMetaThinking": true
  },
  "ui": {
    "showProgress": true,
    "showDecisionTrees": true,
    "showConfidenceScores": true,
    "inlineHints": true
  },
  "advanced": {
    "maxAutonomy": true,
    "extendedThinking": true,
    "selfTesting": true
  }
}
```

## 🚨 Common Issues

### Issue: Completions not working
```bash
# Check server
curl http://localhost:3000/health

# Restart Cursor
Cmd+Shift+P → "Reload Window"
```

### Issue: Slow completions
Check which provider is active:
- Switch to faster provider (Mistral/Hugging Face)
- Reduce `maxBatchSize` in config

### Issue: Wrong language suggestions
Agent 4 auto-detects language. Force it:
```json
{
  "language": "typescript",
  "framework": "react"
}
```

## 💪 Pro Tips

1. **Use Comments**: Agent 4 reads comments for context
```typescript
// Create a user registration endpoint with email verification
// Requirements: bcrypt password, send verification email, rate limiting
```

2. **Leverage Meta-Thinking**: Ask for explanations
```
Cmd+K: "Why did you choose MongoDB over PostgreSQL?"
```

3. **Batch Refactoring**: Select multiple files
```
Right-click folder → "Refactor with Agent 4"
```

4. **Checkpoints**: Save before major changes
```
Cmd+K: "Create checkpoint before refactoring"
```

5. **Pattern Learning**: Agent 4 learns your patterns
```
After a few similar edits, it suggests the pattern automatically
```

## 📈 Performance Tips

- **Faster completions**: Use Mistral (2-3s average)
- **Better context**: Keep related files open
- **Batch operations**: Let agent handle multiple files
- **Cache hits**: Repeated operations are faster

## 🔐 Security

- Local server only (localhost:3000)
- API keys never exposed to client
- Code never leaves your machine
- Optional: Use VPN for remote access

## 📞 Help & Support

- **Logs**: Check `.cursor/agent4-logs/`
- **Issues**: https://github.com/NovusAevum/agent4-implementation/issues
- **Docs**: See README.md

---

**🎉 You're ready to code at superhuman speed with Agent 4!**

**Next Steps:**
1. Try the chat interface (`Cmd+K`)
2. Enable inline suggestions
3. Create your first checkpoint
4. Explore meta-thinking features

**Happy coding! 🚀**
