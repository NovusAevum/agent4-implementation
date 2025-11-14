# GitHub Actions Setup Guide

## Overview

This repository includes GitHub Actions workflows for automating Agent 4 deployment and synchronization with Hugging Face.

## Workflows

### 1. Sync Env to Hugging Face (`sync-hf-env.yml`)

**Purpose**: Automatically sync environment variables to Hugging Face Space

**Triggers**:
- Daily at midnight (UTC)
- Manual dispatch via GitHub Actions UI

**Requirements**:
- Hugging Face account
- Hugging Face Space created
- GitHub Secrets configured

## Required GitHub Secrets

Configure these secrets in your repository settings:
`Settings → Secrets and variables → Actions → New repository secret`

### Hugging Face Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `HF_TOKEN` | `hf_xxxxx...` | Hugging Face API token (write access) |
| `HF_USERNAME` | `LetsTryGPT` | Hugging Face username |

### Optional API Keys (if needed)

| Secret Name | Description |
|------------|-------------|
| `CONTINUE_API_KEY` | Continue.dev API key |
| `ALIBABA_QWEN_API_KEY` | Alibaba Qwen API key |
| `KIMI_API_KEY` | Moonshot Kimi API key |
| `CODECOPILOT_KEY` | Code Copilot API key |

## Setup Instructions

### Step 1: Configure GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `HF_TOKEN`
   - Value: Your Hugging Face token (get from https://huggingface.co/settings/tokens)
   - Click **Add secret**
5. Repeat for `HF_USERNAME` with value `LetsTryGPT`

### Step 2: Create Hugging Face Space

1. Go to [Hugging Face](https://huggingface.co)
2. Click **New** → **Space**
3. Name: `agent4-implementation`
4. SDK: Choose appropriate SDK (Docker, Gradio, Streamlit, etc.)
5. Click **Create Space**

### Step 3: Verify Workflow

1. Go to **Actions** tab in your repository
2. Select **Sync Env to Hugging Face** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for completion
5. Check Hugging Face Space settings to verify variables

## Troubleshooting

### Workflow Fails at "Set up job"

**Cause**: Workflow file doesn't exist or is misconfigured

**Solution**:
1. Ensure `.github/workflows/sync-hf-env.yml` exists
2. Check YAML syntax
3. Verify workflow permissions

### Workflow Fails at "Sync environment variables"

**Cause**: Missing or invalid secrets

**Solution**:
1. Verify `HF_TOKEN` is set correctly
2. Ensure token has write access to spaces
3. Check `HF_USERNAME` matches your Hugging Face account

### "Repository not found" Error

**Cause**: Space doesn't exist or token lacks permissions

**Solution**:
1. Create the space on Hugging Face first
2. Ensure space name matches: `agent4-implementation`
3. Verify token has access to the space

### "Authentication failed" Error

**Cause**: Invalid or expired Hugging Face token

**Solution**:
1. Generate new token at https://huggingface.co/settings/tokens
2. Ensure token has **write** access
3. Update `HF_TOKEN` secret in GitHub

## Manual Workflow Execution

To manually trigger the workflow:

```bash
# Using GitHub CLI
gh workflow run sync-hf-env.yml

# Or via GitHub UI
1. Go to Actions tab
2. Select "Sync Env to Hugging Face"
3. Click "Run workflow"
4. Select branch: main
5. Click "Run workflow"
```

## Workflow Details

### Environment Variables Synced

The workflow syncs these variables to your Hugging Face Space:

```yaml
NODE_ENV: production
PORT: 3000
DEFAULT_LLM_PROVIDER: continue
FALLBACK_ORDER: continue,alibaba,kimi,codestral
AGENT4_ENABLED: true
WORKFLOW_MODE: 4-phase
```

### Workflow Schedule

- **Frequency**: Daily at 00:00 UTC
- **Cron**: `0 0 * * *`
- **Timezone**: UTC

To change the schedule, edit the cron expression in `.github/workflows/sync-hf-env.yml`:

```yaml
schedule:
  - cron: '0 0 * * *'  # Daily at midnight UTC
  # Examples:
  # - cron: '0 */6 * * *'  # Every 6 hours
  # - cron: '0 12 * * *'   # Daily at noon UTC
  # - cron: '0 0 * * 0'    # Weekly on Sunday
```

## Workflow Logs

To view workflow logs:

1. Go to **Actions** tab
2. Click on a workflow run
3. Click on the job name
4. Expand steps to see detailed logs

## Disabling Workflows

To disable a workflow:

1. Go to **Actions** tab
2. Select the workflow
3. Click **⋯** (three dots)
4. Click **Disable workflow**

Or delete the workflow file:

```bash
rm .github/workflows/sync-hf-env.yml
git commit -m "Disable Hugging Face sync workflow"
git push
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate tokens** regularly
4. **Use fine-grained tokens** with minimal permissions
5. **Review workflow logs** for exposed secrets
6. **Enable branch protection** to prevent unauthorized changes

## Additional Workflows

You can add more workflows for:

- **CI/CD**: Automated testing and deployment
- **Documentation**: Auto-generate docs
- **Notifications**: Slack/Discord notifications
- **Backups**: Automated backups to cloud storage

Example workflow structure:

```yaml
name: Your Workflow Name

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  your-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Your step
        run: echo "Hello Agent 4"
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Hugging Face Spaces Documentation](https://huggingface.co/docs/hub/spaces)
- [Hugging Face Hub Python Library](https://huggingface.co/docs/huggingface_hub)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)

## Support

If you encounter issues:

1. Check workflow logs in Actions tab
2. Verify all secrets are configured
3. Ensure Hugging Face Space exists
4. Review this documentation
5. Open an issue on GitHub

---

**Last Updated**: October 19, 2025  
**Workflow Version**: 1.0.0  
**Status**: ✅ Active
