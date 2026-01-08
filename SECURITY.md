# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### Private Disclosure

**DO NOT** open a public GitHub issue for security vulnerabilities. Instead, please report them privately:

1. **GitHub Security Advisories** (Preferred)
   - Navigate to the [Security Advisories](https://github.com/kmcallorum/pytest-agents/security/advisories) page
   - Click "Report a vulnerability"
   - Provide detailed information about the vulnerability

2. **Direct Contact**
   - Create a private security advisory through GitHub's interface
   - We will respond within 48 hours to acknowledge receipt

### What to Include

When reporting a vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: What can an attacker do with this vulnerability?
- **Reproduction Steps**: Step-by-step instructions to reproduce the issue
- **Affected Versions**: Which versions are affected?
- **Suggested Fix**: If you have suggestions for fixing the issue
- **Proof of Concept**: Code or screenshots demonstrating the vulnerability (if applicable)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days with our assessment
- **Fix Timeline**: Depends on severity
  - **Critical**: Patch within 7 days
  - **High**: Patch within 14 days
  - **Medium**: Patch within 30 days
  - **Low**: Patch within 90 days

### Disclosure Policy

- We will work with you to understand and validate the vulnerability
- We will develop and test a fix
- We will publicly disclose the vulnerability after a fix is available
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Features

pytest-agents implements the following security measures:

### Code Security

- **CodeQL Analysis**: Automated security scanning for Python and JavaScript/TypeScript
- **Dependency Scanning**: Automated vulnerability detection via Dependabot
- **Static Analysis**: Continuous code quality and security checks

### Container Security

- **Multi-stage Builds**: Minimal attack surface in production images
- **Non-root User**: Containers run with least privilege
- **Dependency Pinning**: Locked dependencies for reproducible builds

### Development Security

- **Code Review**: All changes require review before merging
- **Automated Testing**: Comprehensive test coverage (57%)
- **CI/CD Pipeline**: Automated security checks on every commit

## Security Best Practices

When using pytest-agents, we recommend:

### API Keys and Secrets

- **Never** commit API keys or secrets to version control
- Use environment variables for sensitive configuration
- Rotate API keys regularly
- Use separate keys for development and production

### Docker Deployment

```bash
# Run with security options
docker run --security-opt=no-new-privileges:true \
           --cap-drop=ALL \
           --read-only \
           pytest_agents:latest
```

### Python Environment

```bash
# Install with security-focused dependencies
uv pip install --system -e ".[dev]"

# Verify package integrity
uv pip check
```

## Known Security Considerations

### Agent Execution

The TypeScript agents execute Node.js code. Ensure:

- Agent scripts are from trusted sources
- Review agent code before execution
- Use appropriate file system permissions
- Limit agent timeout values

### Pytest Plugin

The pytest plugin executes in the test environment:

- Isolate test environments from production
- Use separate credentials for testing
- Review test code for security issues

## Security Updates

We release security updates as follows:

- **Critical**: Immediate patch release
- **High**: Within 2 weeks
- **Medium**: Next minor version
- **Low**: Next major version

Subscribe to [GitHub Security Advisories](https://github.com/kmcallorum/pytest-agents/security/advisories) for notifications.

## Compliance

pytest-agents development follows:

- OWASP Top 10 security practices
- GitHub Security Best Practices
- Python Security Guidelines
- Node.js Security Best Practices

## Security Scanning Results

Current security posture:

- **CodeQL**: ![CodeQL](https://github.com/kmcallorum/pytest-agents/actions/workflows/codeql.yml/badge.svg)
- **Dependency Scanning**: Automated via Dependabot
- **Last Security Audit**: 2026-01-02

## Contact

For security-related questions that are not vulnerabilities:

- Open a GitHub Discussion
- Tag with "security" label
- Contact maintainers via GitHub

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

*No vulnerabilities reported yet*

---

**Last Updated**: 2026-01-02
