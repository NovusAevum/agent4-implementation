# 🚀 Deployment Guide for Agent4 Multi-LLM

## ✅ Status: Code Successfully Pushed to GitHub!

**Repository:** https://github.com/NovusAevum/agent4-implementation

---

## 📋 Pre-Deployment Checklist

- [x] Code pushed to GitHub
- [x] CI/CD pipeline configured
- [x] Docker configuration optimized
- [x] Security scanning integrated
- [ ] **Add GitHub Secrets (CRITICAL - Do This Now!)**
- [ ] Verify CI/CD workflow runs
- [ ] Deploy to Hugging Face Spaces
- [ ] Verify deployment is live

---

## 🔐 Step 1: Add GitHub Secrets (REQUIRED)

### Navigate to GitHub Secrets

1. Go to your repository: https://github.com/NovusAevum/agent4-implementation
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets

Add the following secrets one by one:

#### LLM Provider API Keys

| Secret Name | Description | Where to Get |
|------------|-------------|--------------|
| `HF_TOKEN` | Hugging Face API Token | https://huggingface.co/settings/tokens |
| `MISTRAL_API_KEY` | Mistral AI API Key | https://console.mistral.ai/ |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | https://platform.deepseek.com/ |
| `OPENROUTER_API_KEY` | OpenRouter API Key | https://openrouter.ai/keys |
| `CODESTRAL_API_KEY` | Codestral API Key | https://console.mistral.ai/ |

#### Optional Provider Keys (if you have them)

| Secret Name | Description |
|------------|-------------|
| `ALIBABA_QWEN_API_KEY` | Alibaba Qwen API Key |
| `KIMI_API_KEY` | Kimi API Key |
| `CONTINUE_API_KEY` | Continue.dev API Key |

### Quick Command to Add Secrets (using GitHub CLI)

If you have GitHub CLI installed, run these commands:

```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Login
gh auth login

# Navigate to your repo
cd /Users/wmh/CascadeProjects/agent4-implementation

# Add secrets (replace YOUR_KEY with actual keys)
gh secret set HF_TOKEN --body "YOUR_HUGGINGFACE_TOKEN"
gh secret set MISTRAL_API_KEY --body "YOUR_MISTRAL_KEY"
gh secret set DEEPSEEK_API_KEY --body "YOUR_DEEPSEEK_KEY"
gh secret set OPENROUTER_API_KEY --body "YOUR_OPENROUTER_KEY"
gh secret set CODESTRAL_API_KEY --body "YOUR_CODESTRAL_KEY"

# Verify secrets were added
gh secret list
```

---

## 🔄 Step 2: Verify CI/CD Pipeline

### Automatic Trigger

The CI/CD pipeline will automatically trigger after pushing code. Check the status:

```bash
# View workflow runs
gh run list

# Watch the latest run
gh run watch
```

### Manual Trigger

You can also manually trigger the workflow:

1. Go to: https://github.com/NovusAevum/agent4-implementation/actions
2. Click on **"CI/CD - Test, Build, Secure, Deploy"**
3. Click **"Run workflow"** → **"Run workflow"**

### What the Pipeline Does

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Test & Lint                                       │
│  ✓ Install dependencies                                     │
│  ✓ Run ESLint                                              │
│  ✓ Run Jest tests                                          │
│  ✓ Upload coverage report                                  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: Security Scan                                     │
│  ✓ Trivy vulnerability scanner                             │
│  ✓ TruffleHog secret detection                            │
│  ✓ Upload SARIF to GitHub Security                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: Build Application                                 │
│  ✓ TypeScript compilation                                  │
│  ✓ Create distribution files                               │
│  ✓ Upload build artifacts                                  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 4: Build & Push Docker Image                        │
│  ✓ Build optimized Docker image                            │
│  ✓ Push to GitHub Container Registry                       │
│  ✓ Tag as latest                                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 5: Deploy to Hugging Face Spaces                    │
│  ✓ Clone HF Space repository                               │
│  ✓ Copy files and configurations                           │
│  ✓ Commit and push to HF                                   │
│  ✓ Trigger Space rebuild                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤗 Step 3: Deploy to Hugging Face Spaces

### Option A: Automatic Deployment (via CI/CD)

Once you've added the GitHub secrets, the CI/CD pipeline will automatically deploy to Hugging Face Spaces when you push to the `main` branch.

**Requirements:**
- `HF_TOKEN` secret must be added to GitHub
- The token needs write access to Spaces

### Option B: Manual Deployment

#### Prerequisites

```bash
# Install Hugging Face CLI
pip install --upgrade huggingface_hub

# Login to Hugging Face
huggingface-cli login
# Enter your HF token when prompted
```

#### Deploy Script

```bash
cd /Users/wmh/CascadeProjects/agent4-implementation

# Configure git for HF
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Create a new Hugging Face Space (if not exists)
huggingface-cli repo create NovusAevum/agent4-implementation --type space --space_sdk docker

# Clone the space
git clone https://huggingface.co/spaces/NovusAevum/agent4-implementation hf-space

# Copy files to the space directory
cp -r Dockerfile huggingface.yaml package*.json tsconfig.json src dist hf-space/

# Create README for HF Space
cd hf-space
cat > README.md << 'EOF'
---
title: Agent4 Multi-LLM
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: docker
app_port: 3000
pinned: false
---

# Agent4 Multi-LLM Implementation

A production-ready multi-LLM AI agent with automatic fallback support.

## Features
- 🔄 Automatic LLM fallback
- 🏥 Health monitoring
- 🔒 Enterprise security
- 📊 Real-time metrics
- 🐳 Docker optimized

## API Usage

```bash
curl -X POST https://your-space-url/api/agent4/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Analyze requirements",
    "context": {}
  }'
```

## Supported Providers
- Hugging Face
- Mistral AI
- DeepSeek
- OpenRouter
- Codestral
EOF

# Commit and push
git add .
git commit -m "Deploy Agent4 Multi-LLM Implementation"
git push
```

### Set Environment Variables in HF Space

1. Go to your Space: https://huggingface.co/spaces/NovusAevum/agent4-implementation
2. Click **Settings** → **Variables and secrets**
3. Add the following secrets:

```
HF_TOKEN=your_huggingface_token
MISTRAL_API_KEY=your_mistral_key
DEEPSEEK_API_KEY=your_deepseek_key
OPENROUTER_API_KEY=your_openrouter_key
CODESTRAL_API_KEY=your_codestral_key
NODE_ENV=production
PORT=3000
DEFAULT_LLM_PROVIDER=huggingface
FALLBACK_ORDER=huggingface,mistral,deepseek,openrouter,codestral
```

---

## ✅ Step 4: Verify Deployment

### Check Space Status

1. Visit: https://huggingface.co/spaces/NovusAevum/agent4-implementation
2. Wait for the build to complete (usually 5-10 minutes)
3. Look for the green "Running" status

### Test the Deployment

```bash
# Health check
curl https://novusaevum-agent4-implementation.hf.space/health

# Execute a task
curl -X POST https://novusaevum-agent4-implementation.hf.space/api/agent4/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create a simple hello world function in Python",
    "context": {
      "language": "python",
      "requirements": "simple function"
    }
  }'
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "plan": "...",
    "discovery": {...},
    "execution": {...},
    "validation": {...},
    "metadata": {
      "startTime": 1728540713000,
      "endTime": 1728540745000,
      "provider": "huggingface",
      "stepsCompleted": ["plan", "discover", "execute", "validate"]
    }
  }
}
```

---

## 🔍 Step 5: Monitor and Debug

### View Logs

#### GitHub Actions Logs
- Go to: https://github.com/NovusAevum/agent4-implementation/actions
- Click on the latest workflow run
- Expand each step to view logs

#### Hugging Face Space Logs
- Go to your Space settings
- Click on "Logs" tab
- View real-time logs

### Common Issues and Solutions

#### Issue 1: Pipeline Fails at Security Stage
```bash
# Solution: Review the security report
gh run view --log-failed

# Check for exposed secrets
grep -r "sk-" . --exclude-dir=node_modules
grep -r "hf_" . --exclude-dir=node_modules
```

#### Issue 2: Docker Build Fails
```bash
# Test locally
docker build -t agent4-test .
docker run -p 3000:3000 agent4-test

# Check logs
docker logs agent4-test
```

#### Issue 3: HF Space Not Starting
```bash
# Verify environment variables are set
# Check Dockerfile paths
# Review build logs in HF Space
```

---

## 🎯 Step 6: Windsurf Cascade Integration

### Install Agent4 in Windsurf Cascade

Create a configuration file for Windsurf integration:

```typescript
// windsurf-cascade.config.ts
import { Agent4Workflow } from './src/agent4/workflow';

export const agent4Config = {
  endpoint: 'https://novusaevum-agent4-implementation.hf.space/api/agent4/execute',
  apiKey: process.env.AGENT4_API_KEY, // Optional: if you add authentication
  defaultProvider: 'huggingface',
  timeout: 30000,
  retries: 3
};

export async function executeAgent4Task(task: string, context: any) {
  const response = await fetch(agent4Config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(agent4Config.apiKey && { 'Authorization': `Bearer ${agent4Config.apiKey}` })
    },
    body: JSON.stringify({ task, context })
  });
  
  return response.json();
}
```

### Use in Windsurf Cascade

```typescript
import { executeAgent4Task } from './windsurf-cascade.config';

// Example: Code generation task
const result = await executeAgent4Task(
  'Generate a REST API endpoint for user authentication',
  {
    language: 'typescript',
    framework: 'express',
    database: 'postgresql'
  }
);

console.log(result.data.execution);
```

---

## 📊 Monitoring Dashboard

### GitHub Actions Status
- **URL**: https://github.com/NovusAevum/agent4-implementation/actions
- **Monitors**: Tests, builds, deployments

### Hugging Face Space
- **URL**: https://huggingface.co/spaces/NovusAevum/agent4-implementation
- **Monitors**: Space health, API uptime

### Docker Image
- **Registry**: ghcr.io/novusaevum/agent4-implementation:latest
- **Pull**: `docker pull ghcr.io/novusaevum/agent4-implementation:latest`

---

## 🎉 Success Checklist

- [ ] ✅ Code pushed to GitHub
- [ ] ✅ All secrets added to GitHub
- [ ] ✅ CI/CD pipeline runs successfully
- [ ] ✅ Security scans pass
- [ ] ✅ Docker image built and pushed
- [ ] ✅ Deployed to Hugging Face Spaces
- [ ] ✅ Health endpoint responding
- [ ] ✅ API endpoint tested
- [ ] ✅ Windsurf Cascade configured

---

## 📞 Need Help?

### Quick Commands Reference

```bash
# View GitHub workflow status
gh run list

# Check latest workflow
gh run view

# Pull latest Docker image
docker pull ghcr.io/novusaevum/agent4-implementation:latest

# Run locally
docker run -p 3000:3000 --env-file .env ghcr.io/novusaevum/agent4-implementation:latest

# Test health endpoint
curl http://localhost:3000/health

# Test API
curl -X POST http://localhost:3000/api/agent4/execute \
  -H "Content-Type: application/json" \
  -d '{"task": "Hello world", "context": {}}'
```

### Resources

- 📚 [GitHub Repository](https://github.com/NovusAevum/agent4-implementation)
- 🤗 [Hugging Face Space](https://huggingface.co/spaces/NovusAevum/agent4-implementation)
- 🐳 [Docker Image](https://github.com/NovusAevum/agent4-implementation/pkgs/container/agent4-implementation)
- 📖 [Full Documentation](./README.md)

---

<div align="center">

**🚀 Your Agent4 Multi-LLM is ready for deployment!**

Follow the steps above to complete the deployment process.

</div>
