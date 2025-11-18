# Hugging Face Spaces Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Agent4 Implementation to Hugging Face Spaces.

**Live Space**: https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm

## Prerequisites

- Hugging Face account with Spaces access
- GitHub repository with Agent4 code
- API keys for at least one LLM provider
- Understanding of Docker and Python

## Automatic Deployment Setup

Agent4 is configured for automatic deployment via GitHub Actions.

### Step 1: Connect GitHub Repository

1. Go to https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm
2. Click "Settings" (gear icon)
3. Under "Repository", connect your GitHub account
4. Select `LetsTryGPT/agent4-implementation` repository
5. Set branch to `main`

### Step 2: Enable GitHub Sync

```yaml
# File: .github/workflows/sync-hf-space.yml
name: Sync to Hugging Face Spaces

on:
  push:
    branches: [main]
    paths:
      - 'app.py'
      - 'requirements.txt'
      - 'package.json'
      - 'README_HF_SPACE.md'
      - '.github/workflows/sync-hf-space.yml'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Push to HF Spaces
        env:
          HF_TOKEN: ${{ secrets.HF_TOKEN_SPACES }}
        run: |
          git config --global user.email "bot@agent4.dev"
          git config --global user.name "Agent4 Bot"
          git remote add space https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm
          git push --force https://user:$HF_TOKEN@huggingface.co/spaces/LetsTryGPT/agent4-multi-llm main
```

## Manual Deployment

### Step 1: Set Environment Variables

In the Space settings, add the following secrets:

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `HF_TOKEN` | Secret | Yes | Hugging Face API token |
| `MISTRAL_API_KEY` | Secret | No | Mistral API key |
| `DEEPSEEK_API_KEY` | Secret | No | DeepSeek API key |
| `OPENROUTER_API_KEY` | Secret | No | OpenRouter API key |
| `CODESTRAL_API_KEY` | Secret | No | Codestral API key |

### Step 2: Configure Startup

The Space will automatically:

1. Install Node.js dependencies: `npm ci`
2. Build TypeScript/React: `npm run build`
3. Start Gradio interface: `python app.py`

### Step 3: Configure Secrets

1. Click "Settings" → "Repository secrets"
2. Add each required secret
3. Save configuration

## File Structure for Spaces

```
agent4-implementation/
├── app.py                      # Gradio interface (main entry point)
├── requirements.txt            # Python dependencies
├── package.json                # Node.js dependencies
├── README_HF_SPACE.md          # Space README with YAML frontmatter
├── spaces_config.yaml          # Advanced Spaces configuration
├── HF_SPACES_DEPLOYMENT.md     # This file
├── src/                        # TypeScript source
│   ├── index.ts
│   ├── agent4/
│   ├── llm/
│   ├── config/
│   └── utils/
├── dist/                       # Compiled JavaScript (generated)
├── public/                     # Static assets
├── Dockerfile                  # Container definition
└── docker-compose.yml          # Local testing
```

## Python Dependencies (requirements.txt)

```
gradio==4.37.2
python-dotenv==1.0.0
requests==2.31.0
aiohttp==3.9.1
pydantic==2.5.0
pydantic-settings==2.1.0
typing-extensions==4.8.0
anyio==4.1.1
```

All Python dependencies are minimal. The main application runs in Node.js.

## Node.js Dependencies

Install via npm:
```bash
npm install
```

Key dependencies:
- `express`: HTTP server
- `axios`: HTTP client for API calls
- `zod`: TypeScript-first schema validation
- `react`: UI framework
- `@opentelemetry/*`: Observability

## Configuration

### Environment Variables

Set in Space Settings → "Repository secrets":

```env
# Application
NODE_ENV=production
PORT=3000

# LLM Providers (at least one required)
HF_TOKEN=hf_xxxxxxxxxxxx
MISTRAL_API_KEY=xxx
DEEPSEEK_API_KEY=xxx
OPENROUTER_API_KEY=xxx
CODESTRAL_API_KEY=xxx

# Settings
DEFAULT_LLM_PROVIDER=huggingface
FALLBACK_ORDER=huggingface,mistral,deepseek,openrouter,codestral
LOG_LEVEL=info
```

### Build Configuration

Automatic build happens on push to main branch:

1. **Install**: `npm ci --production=false`
2. **Build**: `npm run build`
3. **Package**: Gradio serves compiled assets

## Gradio Interface

The `app.py` file provides a web interface with tabs for:

- **Status**: Application health and readiness
- **Build Info**: Build timestamp and git commit
- **Dependencies**: Node.js and Python packages
- **Documentation**: README content preview
- **Configuration**: Current environment settings

### Interface Features

- Real-time status updates
- Dependency inspection
- Build information tracking
- Configuration review
- Direct links to GitHub and main Space

## Health Checks

The Space includes health checks:

```
Endpoint: /health
Interval: 10 seconds
Timeout: 5 seconds
Failure threshold: 3
Success threshold: 1
Initial delay: 30 seconds
```

## Monitoring & Logging

### View Logs

1. Open Space → "Logs" tab
2. Scroll to see real-time output
3. Filter by service (app, build, system)

### Key Log Messages

```
Building Agent4 implementation...
Build completed successfully
Starting Gradio interface...
[Gradio] interface launched at http://localhost:7860
Application ready for deployment
```

## Troubleshooting

### Build Failures

**Error**: `npm ERR! code ERESOLVE`

**Solution**:
```bash
npm ci --legacy-peer-deps
```

**Error**: `TypeScript compilation errors`

**Solution**:
```bash
npm run typecheck
npm run build
```

### Runtime Issues

**Error**: `Port 3000 already in use`

**Solution**: Increase `PORT` environment variable or check for zombie processes

**Error**: `Node.js version mismatch`

**Solution**: Ensure Dockerfile uses Node.js 18+

### API Key Issues

**Error**: `401 Unauthorized` from provider

**Solution**:
1. Verify API key in Settings → Secrets
2. Check secret name matches code
3. Restart Space to reload environment

## Performance Optimization

### Cold Start Optimization

1. **Persistent Storage**: Install dependencies once
2. **Pre-built Assets**: Cache npm modules
3. **Minimal Startup**: Gradio launches quickly

### Resource Allocation

Default allocation:
- CPU: 2 cores
- Memory: 16GB
- Disk: 50GB

For higher traffic, request upgrade in Settings.

## Security Best Practices

1. **Secrets**: Never commit API keys
2. **Environment Variables**: Use Space secrets, not .env files
3. **CORS**: Configured for huggingface.co only
4. **Rate Limiting**: Built-in protection
5. **TLS**: All communications encrypted

## Updating the Space

### Method 1: GitHub Push (Recommended)

```bash
git add .
git commit -m "Update Agent4"
git push origin main
```

Space automatically syncs and redeploys.

### Method 2: Manual Upload

1. Open Space Settings
2. Click "Files" → "Upload"
3. Select files to update
4. Trigger rebuild

### Method 3: Git Clone

```bash
git clone https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm
cd agent4-multi-llm
# Make changes
git push
```

## Rolling Back

If issues occur:

1. **View History**: Settings → "Space history"
2. **Select Previous**: Click timestamp to revert
3. **Restore**: Confirm restoration

## Continuous Integration

GitHub Actions automatically:

1. Run tests on pull requests
2. Build Docker image
3. Sync to Spaces on main branch push
4. Update Space documentation

## Advanced Customization

### Custom Startup Script

Edit Space environment to run custom commands:

```bash
#!/bin/bash
npm ci --production=false
npm run build
python app.py
```

### Custom Domain

Available for Pro spaces:
1. Settings → "Custom domain"
2. Configure DNS records
3. Enable HTTPS

### Persistent Data

Access persistent storage:

```python
import os
data_dir = os.environ.get('PERSISTENT_DATA_DIR', '/data')
```

## Monitoring & Analytics

### Metrics Available

- Request count and latency
- Provider fallback frequency
- Error rates and types
- Cache performance
- Resource usage

### Access Metrics

Via `/metrics` endpoint (Prometheus format)

## Scaling

For increased traffic:

1. **Request Upgrade**: Settings → "Resources"
2. **Options**: Up to 8 CPU + 32GB RAM
3. **GPU Available**: T4, A10, A100 options

## Support & Troubleshooting

### Community Resources

- GitHub Issues: https://github.com/LetsTryGPT/agent4-implementation/issues
- Discussions: https://github.com/LetsTryGPT/agent4-implementation/discussions
- Hugging Face Hub: https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

View detailed logs in Space Logs tab.

## Testing Locally

Before pushing to Spaces:

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Run locally
python app.py

# Test at http://localhost:7860
```

## Production Checklist

- [ ] All API keys configured as secrets
- [ ] README_HF_SPACE.md updated
- [ ] requirements.txt includes all Python packages
- [ ] app.py runs without errors
- [ ] npm build succeeds
- [ ] Health checks passing
- [ ] Logs show clean startup
- [ ] Gradio interface accessible
- [ ] API endpoints responding
- [ ] Rate limiting configured
- [ ] CORS properly set up

## Performance Targets

- **Build Time**: < 5 minutes
- **Startup Time**: < 2 minutes
- **API Response**: < 500ms p95
- **Uptime**: 99.5% SLA

## Next Steps

1. Configure API keys in Space Secrets
2. Push code to GitHub main branch
3. Monitor Space Logs for startup
4. Test Gradio interface
5. Verify API endpoints
6. Share Space URL

## Additional Resources

- [Hugging Face Spaces Docs](https://huggingface.co/docs/hub/spaces)
- [Gradio Documentation](https://www.gradio.app/)
- [Agent4 Repository](https://github.com/LetsTryGPT/agent4-implementation)
- [Space Configuration Reference](https://huggingface.co/docs/hub/spaces-config-reference)

---

**Space URL**: https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm

**Repository**: https://github.com/LetsTryGPT/agent4-implementation

Last Updated: November 2025
