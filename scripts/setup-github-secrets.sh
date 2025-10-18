#!/bin/bash

# Setup GitHub Secrets for agent4-implementation
# This script uses the GitHub API to set repository secrets

set -e

REPO="NovusAevum/agent4-implementation"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable is not set"
    echo "Please set it with: export GITHUB_TOKEN='your_token_here'"
    exit 1
fi

echo "🔐 Setting up GitHub Secrets for $REPO..."

# Function to encrypt and set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo "Setting $secret_name..."
    
    # Get public key
    response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO/actions/secrets/public-key")
    
    key_id=$(echo "$response" | jq -r '.key_id')
    public_key=$(echo "$response" | jq -r '.key')
    
    # Encrypt the secret using Python and libsodium
    encrypted=$(python3 << EOF
import base64
import json
from nacl import encoding, public

def encrypt_secret(public_key: str, secret_value: str) -> str:
    public_key_bytes = base64.b64decode(public_key)
    public_key_obj = public.PublicKey(public_key_bytes)
    sealed_box = public.SealedBox(public_key_obj)
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")

print(encrypt_secret("$public_key", "$secret_value"))
EOF
)
    
    # Set the secret
    curl -s -X PUT \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"encrypted_value\":\"$encrypted\",\"key_id\":\"$key_id\"}" \
        "https://api.github.com/repos/$REPO/actions/secrets/$secret_name" > /dev/null
    
    echo "✅ $secret_name set successfully"
}

# Install PyNaCl if not present
if ! python3 -c "import nacl" 2>/dev/null; then
    echo "📦 Installing PyNaCl..."
    pip3 install PyNaCl --quiet
fi

# Set all secrets from environment variables
HF_TOKEN_VALUE="${HF_TOKEN:-}"
HF_USERNAME_VALUE="${HF_USERNAME:-LetsTryGPT}"
VERCEL_KEY_VALUE="${VERCEL_AI_GATEWAY_API_KEY:-}"

if [ -z "$HF_TOKEN_VALUE" ]; then
    echo "⚠️  Warning: HF_TOKEN not set, skipping..."
else
    set_secret "HF_TOKEN" "$HF_TOKEN_VALUE"
fi

set_secret "HF_USERNAME" "$HF_USERNAME_VALUE"

if [ -z "$VERCEL_KEY_VALUE" ]; then
    echo "⚠️  Warning: VERCEL_AI_GATEWAY_API_KEY not set, skipping..."
else
    set_secret "VERCEL_AI_GATEWAY_API_KEY" "$VERCEL_KEY_VALUE"
fi

echo ""
echo "🎉 All secrets configured successfully!"
echo ""
echo "Configured secrets:"
echo "  - HF_TOKEN"
echo "  - HF_USERNAME"
echo "  - VERCEL_AI_GATEWAY_API_KEY"
echo ""
echo "Note: You may need to add additional secrets for Vercel deployment:"
echo "  - VERCEL_TOKEN"
echo "  - VERCEL_ORG_ID"
echo "  - VERCEL_PROJECT_ID"
