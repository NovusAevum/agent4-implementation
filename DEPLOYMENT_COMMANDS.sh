#!/bin/bash
# Agent4 Implementation - Hugging Face Spaces Deployment Commands
# Quick reference for deploying to HF Spaces

set -e  # Exit on error

PROJECT_DIR="/Users/wmh/CascadeProjects/agent4-implementation"
SPACE_URL="https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm"
REPO_URL="https://github.com/LetsTryGPT/agent4-implementation"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Agent4 Implementation - HF Spaces Deployment Commands          ║"
echo "║  Space: $SPACE_URL"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step 1: Verify files exist
print_step "Step 1: Verifying configuration files..."
FILES=(
    "app.py"
    "requirements.txt"
    "README_HF_SPACE.md"
    "spaces_config.yaml"
    "HF_SPACES_DEPLOYMENT.md"
    "HF_SPACES_SETUP_SUMMARY.md"
    "HF_SPACES_QUICK_REFERENCE.md"
    "HUGGING_FACE_SPACES_CONFIGURATION_COMPLETE.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        print_success "Found: $file"
    else
        print_warning "Missing: $file"
    fi
done
echo ""

# Step 2: Check git status
print_step "Step 2: Checking Git status..."
cd "$PROJECT_DIR"
git status
echo ""

# Step 3: Stage files for commit
print_step "Step 3: Staging configuration files..."
git add \
    app.py \
    requirements.txt \
    README_HF_SPACE.md \
    spaces_config.yaml \
    HF_SPACES_DEPLOYMENT.md \
    HF_SPACES_SETUP_SUMMARY.md \
    HF_SPACES_QUICK_REFERENCE.md \
    HUGGING_FACE_SPACES_CONFIGURATION_COMPLETE.md \
    DEPLOYMENT_COMMANDS.sh

print_success "Files staged for commit"
echo ""

# Step 4: Display changes
print_step "Step 4: Changes to be committed:"
git diff --cached --stat
echo ""

# Step 5: Commit changes
print_step "Step 5: Committing changes..."
git commit -m "Configure Agent4 for Hugging Face Spaces deployment

- Add Gradio web interface (app.py, 284 lines)
  * Status, Build Info, Dependencies, Documentation, Configuration tabs
  * Agent4Manager lifecycle management
  * Comprehensive error handling and logging
  
- Add minimal Python dependencies (requirements.txt, 9 packages)
  * Gradio 4.37+ for web interface
  * Pydantic for validation
  * Minimal footprint for HF Spaces

- Add Space documentation (README_HF_SPACE.md, 347 lines)
  * Proper YAML frontmatter for HF discovery
  * Comprehensive feature documentation
  * Getting started guide
  * Architecture and fallback mechanism

- Add advanced configuration (spaces_config.yaml, 198 lines)
  * Resource allocation (2 CPU, 16GB RAM, 50GB disk)
  * Secret management (API keys)
  * Health checks and monitoring
  * Security headers and CORS

- Add deployment guide (HF_SPACES_DEPLOYMENT.md, 455 lines)
  * Step-by-step deployment instructions
  * Troubleshooting procedures
  * Performance optimization
  * Security best practices

- Add setup summary (HF_SPACES_SETUP_SUMMARY.md, 418 lines)
  * Detailed configuration overview
  * Deployment workflow
  * File location reference

- Add quick reference (HF_SPACES_QUICK_REFERENCE.md, 429 lines)
  * Quick lookup guide
  * Essential commands
  * Troubleshooting quick fixes

- Add completion report (HUGGING_FACE_SPACES_CONFIGURATION_COMPLETE.md, 713 lines)
  * Comprehensive status report
  * Verification checklist
  * Sign-off documentation

Total: 2,615 lines of configuration and documentation

Space URL: https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm
Repository: https://github.com/LetsTryGPT/agent4-implementation
Status: Ready for immediate deployment"

print_success "Commit created successfully"
echo ""

# Step 6: Show commit info
print_step "Step 6: Commit information:"
git show --stat
echo ""

# Step 7: Push to main
print_step "Step 7: Pushing to main branch..."
print_warning "This will trigger GitHub Actions and auto-sync to HF Spaces"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    print_success "Pushed to main branch"
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                 DEPLOYMENT IN PROGRESS                         ║"
    echo "╠════════════════════════════════════════════════════════════════╣"
    echo "║                                                                ║"
    echo "║  1. GitHub Actions will automatically sync to HF Spaces       ║"
    echo "║  2. Space will build (3-5 minutes)                            ║"
    echo "║  3. Gradio interface will launch                              ║"
    echo "║                                                                ║"
    echo "║  Monitor at: $SPACE_URL                  ║"
    echo "║  Check Logs tab for build progress                            ║"
    echo "║                                                                ║"
    echo "╠════════════════════════════════════════════════════════════════╣"
    echo "║  NEXT STEPS:                                                   ║"
    echo "║  1. Visit Space Settings                                       ║"
    echo "║  2. Add secrets: HF_TOKEN and optional provider keys          ║"
    echo "║  3. Space will auto-restart with environment variables        ║"
    echo "║  4. Test Gradio interface and API endpoints                   ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
else
    print_warning "Push cancelled. To deploy later, run: git push origin main"
    echo ""
fi

# Display helpful info
print_step "Useful references:"
echo ""
echo "  Documentation:"
echo "    • README_HF_SPACE.md - Space documentation"
echo "    • HF_SPACES_DEPLOYMENT.md - Detailed operations guide"
echo "    • HF_SPACES_QUICK_REFERENCE.md - Quick lookup guide"
echo "    • HUGGING_FACE_SPACES_CONFIGURATION_COMPLETE.md - Full status report"
echo ""
echo "  Configuration files:"
echo "    • app.py - Gradio interface (entry point)"
echo "    • requirements.txt - Python dependencies"
echo "    • spaces_config.yaml - Advanced configuration"
echo ""
echo "  Links:"
echo "    • Space: $SPACE_URL"
echo "    • Repository: $REPO_URL"
echo "    • Gradio Docs: https://www.gradio.app/"
echo ""

print_success "Deployment script complete!"
echo ""
