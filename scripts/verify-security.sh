#!/bin/bash
# Security scanning verification script
# Run this after completing security setup

set -e

echo "🔒 SuperClaude Security Verification"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_passed() {
    echo -e "${GREEN}✓${NC} $1"
}

check_failed() {
    echo -e "${RED}✗${NC} $1"
}

check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: CodeQL Workflow
echo "Checking CodeQL workflow..."
if gh run list --workflow=codeql.yml --limit 1 --json status --jq '.[0].status' | grep -q 'completed'; then
    check_passed "CodeQL workflow has run"
else
    check_warning "CodeQL workflow not found or hasn't run yet"
fi
echo ""

# Check 2: Snyk Token
echo "Checking Snyk configuration..."
if gh secret list | grep -q 'SNYK_TOKEN'; then
    check_passed "SNYK_TOKEN secret is configured"
else
    check_failed "SNYK_TOKEN secret not found"
    echo "  Run: gh secret set SNYK_TOKEN"
fi
echo ""

# Check 3: Snyk Workflow
echo "Checking Snyk workflow..."
if gh run list --workflow=snyk.yml --limit 1 --json status --jq '.[0].status' 2>/dev/null | grep -q 'completed'; then
    check_passed "Snyk workflow has run"
else
    check_warning "Snyk workflow not found or hasn't run yet"
fi
echo ""

# Check 4: Dependabot
echo "Checking Dependabot..."
PR_COUNT=$(gh pr list --author app/dependabot --json number --jq 'length' 2>/dev/null || echo "0")
if [ "$PR_COUNT" -gt "0" ]; then
    check_passed "Dependabot is active ($PR_COUNT PRs)"
else
    check_warning "No Dependabot PRs yet (this is normal if just set up)"
fi
echo ""

# Check 5: Security Policy
echo "Checking security policy..."
if [ -f "SECURITY.md" ]; then
    check_passed "SECURITY.md exists"
else
    check_failed "SECURITY.md not found"
fi
echo ""

# Check 6: Performance Testing
echo "Checking performance testing..."
if gh run list --workflow=performance.yml --limit 1 --json status --jq '.[0].status' 2>/dev/null | grep -q 'completed'; then
    check_passed "Performance testing workflow has run"
else
    check_warning "Performance workflow not found or hasn't run yet"
fi
echo ""

# Summary
echo "======================================"
echo "📊 Summary"
echo "======================================"
echo ""

echo "Recent workflow runs:"
gh run list --limit 5 --json name,status,conclusion --jq '.[] | "\(.name): \(.status) (\(.conclusion // "in progress"))"'
echo ""

echo "Security dashboard:"
echo "  https://github.com/kmcallorum/pytest-agents/security"
echo ""

echo "Next steps:"
echo "  1. Review security alerts (if any)"
echo "  2. Merge Dependabot PRs"
echo "  3. Configure security notifications"
echo ""

echo "For detailed verification, see docs/SECURITY_VERIFICATION.md"
