#!/bin/bash

# Agent4 Multi-LLM - GitHub Secrets Setup Script
# This script helps you add all required secrets to GitHub

set -e

echo "🔐 Agent4 Multi-LLM - GitHub Secrets Setup"
echo "=========================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo ""
    echo "Install it with:"
    echo "  macOS: brew install gh"
    echo "  Linux: See https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo ""
    exit 1
fi

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo "🔑 Not logged in to GitHub. Logging in..."
    gh auth login
fi

echo "✅ GitHub CLI is ready"
echo ""

# Function to add secret
add_secret() {
    local secret_name=$1
    local secret_description=$2
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Adding: $secret_name"
    echo "Description: $secret_description"
    echo ""
    read -sp "Enter value for $secret_name (input hidden): " secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Skipped (empty value)"
        echo ""
        return
    fi
    
    if gh secret set "$secret_name" --body "$secret_value" --repo NovusAevum/agent4-implementation; then
        echo "✅ Successfully added $secret_name"
    else
        echo "❌ Failed to add $secret_name"
    fi
    echo ""
}

echo "📝 Required Secrets for Agent4 Multi-LLM"
echo ""
echo "You'll be prompted to enter each API key."
echo "Press Enter to skip any optional keys."
echo ""
read -p "Press Enter to continue..."
echo ""

# Required secrets
echo "🔑 REQUIRED SECRETS"
echo "==================="
echo ""

add_secret "HF_TOKEN" "Hugging Face API Token (get from https://huggingface.co/settings/tokens)"
add_secret "MISTRAL_API_KEY" "Mistral AI API Key (get from https://console.mistral.ai/)"
add_secret "DEEPSEEK_API_KEY" "DeepSeek API Key (get from https://platform.deepseek.com/)"
add_secret "OPENROUTER_API_KEY" "OpenRouter API Key (get from https://openrouter.ai/keys)"
add_secret "CODESTRAL_API_KEY" "Codestral API Key (get from https://console.mistral.ai/)"

# Optional secrets
echo ""
echo "🔑 OPTIONAL SECRETS"
echo "==================="
echo ""
echo "These are optional. Press Enter to skip if you don't have them."
echo ""

read -p "Do you want to add optional provider keys? (y/N): " add_optional
echo ""

if [[ "$add_optional" =~ ^[Yy]$ ]]; then
    add_secret "ALIBABA_QWEN_API_KEY" "Alibaba Qwen API Key (optional)"
    add_secret "KIMI_API_KEY" "Kimi API Key (optional)"
    add_secret "CONTINUE_API_KEY" "Continue.dev API Key (optional)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secret setup complete!"
echo ""

# List all secrets
echo "📋 Current secrets in repository:"
echo ""
gh secret list --repo NovusAevum/agent4-implementation

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Next Steps:"
echo ""
echo "1. Verify secrets are added above"
echo "2. Trigger the CI/CD pipeline:"
echo "   cd /Users/wmh/CascadeProjects/agent4-implementation"
echo "   git push origin main"
echo ""
echo "3. Monitor the deployment:"
echo "   gh run watch"
echo ""
echo "4. View your deployed Space:"
echo "   https://huggingface.co/spaces/NovusAevum/agent4-implementation"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
