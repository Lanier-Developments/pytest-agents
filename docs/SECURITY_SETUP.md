# Security Setup Guide

This guide walks you through activating SuperClaude's enterprise-grade security features.

## Overview

SuperClaude includes two layers of automated security scanning:

1. **Snyk** - Dependency and container vulnerability scanning
2. **Dependabot** - Automated dependency updates (already active)

## Prerequisites

- GitHub repository admin access
- Snyk account (free tier available)

## Setup Steps

### 1. Set Up Snyk Scanning

Snyk provides comprehensive vulnerability scanning for dependencies and containers.

#### 1.1. Create Snyk Account

1. Go to [snyk.io](https://snyk.io)
2. Sign up with your GitHub account (recommended)
3. Snyk will ask to connect to your repositories - authorize it

#### 1.2. Get Snyk API Token

1. Once logged in to Snyk, click your profile (top right)
2. Navigate to **Account Settings**
3. Scroll to **API Token** section
4. Click **Show** and copy the token
5. Keep this token secure - you'll need it in the next step

#### 1.3. Add Snyk Token to GitHub Secrets

1. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Set:
   - **Name:** `SNYK_TOKEN`
   - **Secret:** Paste your Snyk API token
4. Click **Add secret**

**Verification:**

```bash
# Trigger Snyk workflow manually
gh workflow run snyk.yml

# Wait a few seconds, then check status
gh run list --workflow=snyk.yml --limit 1
```

You should see a successful run.

**What You Get:**

- Python dependency vulnerability scanning
- TypeScript/npm dependency scanning (3 agents)
- Docker container vulnerability scanning
- Daily automated scans
- SARIF results integrated with GitHub Security tab

### 2. Verify Dependabot (Already Active)

Dependabot is already configured and should be creating PRs for dependency updates.

**Check Status:**

1. Go to **Insights** → **Dependency graph** → **Dependabot**
2. You should see 5 ecosystems being monitored:
   - pip (Python)
   - npm (pm agent)
   - npm (research agent)
   - npm (index agent)
   - github-actions

**What You Get:**

- Weekly dependency update PRs
- Security updates grouped separately
- Automatic vulnerability detection
- Open PR limit of 5 per ecosystem

## Security Dashboard

Once setup is complete, view your security posture:

### GitHub Security Tab

```
Repository → Security Tab
```

You'll see:
- **Overview**: Security alerts summary
- **Dependabot**: Dependency vulnerabilities
- **Secret scanning**: Exposed secrets (if enabled)

### Snyk Dashboard

```
snyk.io → Projects
```

You'll see:
- Vulnerability count by severity
- Recommended fix PRs
- License compliance issues
- Dependency tree analysis

## Automated Scanning Schedule

| Scanner    | Trigger                          | Frequency |
|------------|----------------------------------|-----------|
| Snyk       | Push, PR, Schedule               | Daily     |
| Dependabot | Automatic                        | Weekly    |
| CI Tests   | Push, PR                         | Every push|

## Security Findings Workflow

When a vulnerability is detected:

1. **Alert Created**: GitHub creates a security alert
2. **Notification**: Repository admins are notified
3. **Analysis**: Review the finding in Security tab
4. **Fix**:
   - Dependabot may auto-create a fix PR
   - Or manually update the dependency
5. **Verify**: CI runs tests on the fix
6. **Merge**: Once tests pass, merge the fix

## Best Practices

### Responding to Security Alerts

1. **Prioritize by Severity**:
   - Critical: Fix within 7 days
   - High: Fix within 14 days
   - Medium: Fix within 30 days
   - Low: Fix within 90 days

2. **Review Context**:
   - Is the vulnerable code path actually used?
   - Are there mitigating controls?
   - What's the exploit complexity?

3. **Test Thoroughly**:
   - Run full test suite
   - Manual testing for critical paths
   - Check for breaking changes

### Keeping Dependencies Updated

```bash
# Review pending dependency updates
gh pr list --label dependencies

# Check for security updates specifically
gh pr list --label dependencies | grep security

# Review Dependabot PRs
gh pr list --author app/dependabot
```

### Manual Security Checks

```bash
# Run security linting locally
make lint

# Run full test suite
make test

# Check for known vulnerabilities (requires Snyk CLI)
snyk test

# Docker security scan (requires Snyk CLI)
snyk container test superclaude:latest
```

## Installing Snyk CLI (Optional)

For local security scanning:

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test Python dependencies
snyk test --file=pyproject.toml

# Test Docker image
docker build -t superclaude:test .
snyk container test superclaude:test

# Test TypeScript agent
cd pm && snyk test
```

## Troubleshooting

### Snyk Workflow Fails

**Error:** "snyk.sarif: No such file or directory"

**Solution:**
1. Verify `SNYK_TOKEN` secret is set correctly
2. Check Snyk service status: [status.snyk.io](https://status.snyk.io)
3. Review workflow logs for authentication errors

**Error:** "SNYK_TOKEN not set"

**Solution:**
Add the secret as described in section 2.3 above.

### Dependabot Not Creating PRs

**Possible Causes:**
1. Already at PR limit (5 per ecosystem)
2. No updates available
3. Dependabot disabled in settings

**Check:**
```bash
# View Dependabot logs
Repository → Insights → Dependency graph → Dependabot
```

## Security Metrics

Track your security posture over time:

### Key Metrics

- **Mean Time to Remediate (MTTR)**: Average time to fix vulnerabilities
- **Vulnerability Backlog**: Number of open security issues
- **Dependency Freshness**: Percentage of up-to-date dependencies
- **Code Coverage**: Percentage of code tested (current: 60%)

### GitHub Insights

```
Repository → Insights → Security
```

View:
- Vulnerability trends over time
- Most common vulnerability types
- Remediation time by severity

## Security Compliance

SuperClaude's security setup helps with:

- **OWASP Top 10**: Dependency scanning helps prevent vulnerable dependencies
- **CWE Coverage**: Common Weakness Enumeration patterns via Snyk
- **NIST Guidelines**: Follows secure coding practices
- **SOC 2**: Audit trail via GitHub Security logs

## Next Steps

After completing setup:

1. ✅ Review any existing security findings
2. ✅ Set up notification preferences in GitHub Settings
3. ✅ Schedule regular security review meetings
4. ✅ Document your security incident response plan
5. ✅ Consider adding additional security tools:
   - **Trivy**: Alternative container scanner
   - **SonarCloud**: Code quality and security
   - **GitGuardian**: Secret detection

## Support

For security-related questions:

- **Vulnerabilities**: See [SECURITY.md](../SECURITY.md)
- **Setup Issues**: Open a GitHub Discussion
- **Bug Reports**: Use the security issue template

## References

- [Snyk Documentation](https://docs.snyk.io)
- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

---

**Last Updated**: 2026-01-07
