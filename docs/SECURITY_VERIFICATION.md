# Security Scanning Verification Guide

This guide helps you verify that all security scanning features are properly configured and working.

## Quick Status Check

Run this command to check overall security status:

```bash
# Check CodeQL workflow status
gh run list --workflow=codeql.yml --limit 1

# Check Snyk workflow status
gh run list --workflow=snyk.yml --limit 1

# Check for security alerts
gh api /repos/kmcallorum/pytest-agents/code-scanning/alerts

# View security dashboard
open https://github.com/kmcallorum/pytest-agents/security
```

## Detailed Verification

### 1. Verify CodeQL is Enabled

**Check via GitHub CLI:**
```bash
gh api /repos/kmcallorum/pytest-agents \
  --jq '.security_and_analysis.advanced_security.status'
```

**Expected Output:** `"enabled"`

**Check via Web:**
1. Go to: https://github.com/kmcallorum/pytest-agents/settings/security_analysis
2. "Code scanning" should show as "Enabled"
3. You should see "CodeQL" listed

**Verify Workflow Runs:**
```bash
# List recent CodeQL runs
gh run list --workflow=codeql.yml --limit 5

# View most recent run
gh run view --workflow=codeql.yml
```

**Expected:** Successful runs for both Python and JavaScript analysis

### 2. Verify Snyk Token is Configured

**Check Secret Exists:**
```bash
gh secret list | grep SNYK_TOKEN
```

**Expected Output:** `SNYK_TOKEN  Updated YYYY-MM-DD`

**Test Snyk Workflow:**
```bash
# Manually trigger Snyk scan
gh workflow run snyk.yml

# Wait a moment, then check status
gh run list --workflow=snyk.yml --limit 1
```

**Expected:** Workflow runs successfully (may fail if token is invalid)

### 3. Verify Dependabot is Active

**Check Dependabot PRs:**
```bash
gh pr list --author app/dependabot --limit 5
```

**Expected:** You should see dependency update PRs

**Check Dependabot Alerts:**
```bash
gh api /repos/kmcallorum/pytest-agents/dependabot/alerts
```

### 4. View Security Dashboard

**Command Line:**
```bash
# Overall security status
gh repo view kmcallorum/pytest-agents --json securityPolicyUrl,isSecurityPolicyEnabled

# Code scanning alerts (should be empty if no issues)
gh api /repos/kmcallorum/pytest-agents/code-scanning/alerts \
  --jq '.[] | {rule: .rule.id, severity: .rule.severity, state: .state}'

# Dependabot alerts
gh api /repos/kmcallorum/pytest-agents/dependabot/alerts \
  --jq '.[] | {package: .security_advisory.package.name, severity: .security_advisory.severity}'
```

**Web Dashboard:**
```bash
# Open security overview
open https://github.com/kmcallorum/pytest-agents/security

# Open code scanning
open https://github.com/kmcallorum/pytest-agents/security/code-scanning

# Open Dependabot
open https://github.com/kmcallorum/pytest-agents/security/dependabot
```

## Troubleshooting

### CodeQL Not Running

**Issue:** CodeQL workflow exists but doesn't run

**Check:**
```bash
gh workflow view codeql.yml
```

**Solution:**
1. Ensure Code Scanning is enabled in repository settings
2. Check workflow file syntax: `.github/workflows/codeql.yml`
3. Manually trigger: `gh workflow run codeql.yml`

### Snyk Workflow Failing

**Issue:** Snyk workflow runs but fails

**Common Causes:**
1. **Missing Token:** Check `gh secret list | grep SNYK_TOKEN`
2. **Invalid Token:** Regenerate token in Snyk, update secret
3. **Snyk Service Issue:** Check https://status.snyk.io

**Debug:**
```bash
# View failed run logs
gh run view --log-failed --workflow=snyk.yml
```

**Fix:**
```bash
# Update Snyk token
gh secret set SNYK_TOKEN
# Paste new token when prompted

# Re-run failed workflow
gh run rerun <run-id>
```

### No Security Findings

**This is good!** It means:
- ✅ No vulnerabilities detected
- ✅ Code follows security best practices
- ✅ Dependencies are up to date

**Verify it's actually scanning:**
```bash
# Check CodeQL actually analyzed files
gh run view --workflow=codeql.yml --log | grep "Analyzing"

# Check Snyk scanned dependencies
gh run view --workflow=snyk.yml --log | grep "Testing"
```

### Dependabot Not Creating PRs

**Check Configuration:**
```bash
cat .github/dependabot.yml
```

**Trigger Manual Check:**
```bash
# Dependabot runs automatically, but you can check alerts
gh api /repos/kmcallorum/pytest-agents/dependabot/alerts
```

**Note:** Dependabot runs on GitHub's schedule, not immediately

## Security Metrics

### Coverage Checklist

- [x] **Code Scanning (CodeQL):** Analyzes Python and TypeScript for security issues
- [x] **Dependency Scanning (Snyk):** Checks for vulnerable dependencies
- [x] **Container Scanning (Snyk):** Scans Docker images for vulnerabilities
- [x] **Dependency Updates (Dependabot):** Automated dependency updates
- [x] **Security Policy (SECURITY.md):** Vulnerability disclosure process
- [x] **Secret Scanning:** GitHub automatically scans for leaked secrets

### Expected Scan Frequency

| Scanner    | Frequency                  | Trigger          |
|------------|----------------------------|------------------|
| CodeQL     | On push, PR, Weekly        | Automated        |
| Snyk       | On push, PR, Daily         | Automated        |
| Dependabot | Weekly                     | Automated        |
| Performance| On push, PR, Weekly        | Automated        |

### Monitoring Commands

**Daily Check:**
```bash
# Quick status of all security workflows
gh run list --limit 10 | grep -E "(CodeQL|Snyk|Dependabot)"
```

**Weekly Review:**
```bash
# Generate security report
echo "Security Report - $(date)"
echo "================================"
echo ""
echo "CodeQL Status:"
gh run list --workflow=codeql.yml --limit 1
echo ""
echo "Snyk Status:"
gh run list --workflow=snyk.yml --limit 1
echo ""
echo "Open Security Alerts:"
gh api /repos/kmcallorum/pytest-agents/code-scanning/alerts --jq 'length'
echo ""
echo "Dependabot PRs:"
gh pr list --author app/dependabot --json number,title
```

## Success Criteria

Your security scanning is properly configured when:

1. ✅ CodeQL workflow runs successfully on every push
2. ✅ Snyk workflow runs successfully (or skips gracefully if no issues)
3. ✅ Security tab shows all scanning methods active
4. ✅ No critical or high severity alerts (or they're being addressed)
5. ✅ Dependabot creates PRs for dependency updates
6. ✅ Security badges on README are green/passing

## Next Steps

After verification:

1. **Monitor the Security tab:** https://github.com/kmcallorum/pytest-agents/security
2. **Review alerts weekly:** Check for new vulnerabilities
3. **Merge Dependabot PRs:** Keep dependencies updated
4. **Configure notifications:** Settings → Notifications → Security alerts
5. **Add security badge to README:** Show your security posture

## Support

If you encounter issues:

1. Check workflow logs: `gh run view --log-failed --workflow=<name>`
2. Review documentation: [docs/SECURITY_SETUP.md](SECURITY_SETUP.md)
3. Open an issue: `gh issue create --title "Security scan issue"`

---

**Last Updated:** 2026-01-06
