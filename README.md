# SuperClaude

[![CI](https://github.com/kmcallorum/pytest-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/kmcallorum/pytest-agents/actions/workflows/ci.yml)
[![Release](https://github.com/kmcallorum/pytest-agents/actions/workflows/release.yml/badge.svg)](https://github.com/kmcallorum/pytest-agents/actions/workflows/release.yml)
[![GitHub Release](https://img.shields.io/github/v/release/kmcallorum/pytest-agents)](https://github.com/kmcallorum/pytest-agents/releases)
[![PyPI](https://img.shields.io/pypi/v/superclaude)](https://pypi.org/project/superclaude/)
[![CodeQL](https://github.com/kmcallorum/pytest-agents/actions/workflows/codeql.yml/badge.svg)](https://github.com/kmcallorum/pytest-agents/actions/workflows/codeql.yml)
[![Security Policy](https://img.shields.io/badge/security-policy-blue.svg)](SECURITY.md)
[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Test Coverage](https://img.shields.io/badge/coverage-57%25-yellow.svg)](https://github.com/kmcallorum/pytest-agents)
[![Tests](https://img.shields.io/badge/tests-57%20passed-brightgreen.svg)](https://github.com/kmcallorum/pytest-agents)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](docs/DOCKER.md)
[![Code Style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

A pytest plugin framework with AI agent capabilities for project management, research, and code indexing.

## Features

- **Pytest Plugin**: Extended pytest with custom markers and AI agent integration
- **PM Agent**: TypeScript-based project management agent for task tracking and planning
- **Research Agent**: AI-powered research and documentation analysis
- **Index Agent**: Code indexing and intelligent search capabilities
- **Skills System**: Extensible runtime skills for specialized tasks

## Quick Start

### Installation

**From PyPI (Recommended):**
```bash
pip install superclaude
```

**From Docker:**
```bash
docker pull ghcr.io/kmcallorum/pytest-agents:latest
docker run ghcr.io/kmcallorum/pytest-agents:latest superclaude verify
```

**From Source:**
```bash
# Clone repository
git clone https://github.com/kmcallorum/pytest-agents.git
cd pytest-agents

# Install with uv
make install

# Or manually
uv pip install -e ".[dev]"
```

### Verify Installation

```bash
make verify
```

### Run Tests

```bash
# All tests
make test

# Python only
make test-python

# TypeScript only
make test-ts
```

## Project Structure

```
pytest-agents/
├── src/superclaude/     # Python pytest plugin package
├── tests/               # Python tests
├── pm/                  # TypeScript PM agent
├── research/            # TypeScript Research agent
├── index/               # TypeScript Index agent
├── skills/              # Runtime skills
├── commands/            # Command documentation
└── docs/                # Documentation
```

## Usage

### Using Custom Pytest Markers

```python
import pytest

@pytest.mark.unit
def test_basic_functionality():
    assert True

@pytest.mark.integration
@pytest.mark.agent_pm
def test_with_pm_agent(superclaude_agent):
    result = superclaude_agent.invoke('pm', 'analyze_project')
    assert result['status'] == 'success'
```

### Invoking Agents

```python
# Via Python API
from superclaude.agent_bridge import AgentBridge

bridge = AgentBridge()
result = bridge.invoke_agent('pm', 'track_tasks', {'path': './src'})
```

```bash
# Via CLI
superclaude agent pm --action track_tasks --path ./src
```

## Development

### Code Quality

```bash
# Format code
make format

# Lint code
make lint
```

### Health Check

```bash
make doctor
```

## Docker Support

SuperClaude is fully containerized for easy deployment and development.

### Quick Start with Docker

```bash
# Build and run verification
docker-compose up superclaude

# Run tests in Docker
docker-compose --profile test up superclaude-test

# Start development shell
docker-compose --profile dev run superclaude-dev
```

See [Docker Documentation](docs/DOCKER.md) for complete deployment guide.

## Security

SuperClaude implements enterprise-grade security practices:

### Automated Security Scanning

- **CodeQL Analysis**: Continuous security scanning for Python and TypeScript code
- **Dependency Scanning**: Automated vulnerability detection via Dependabot and Snyk
- **Container Scanning**: Docker image vulnerability assessment
- **Code Quality**: Ruff linting with security-focused rules

### Security Features

- Multi-stage Docker builds with minimal attack surface
- Dependency pinning for reproducible builds
- Comprehensive test coverage (57%)
- Automated security updates grouped by severity

### Setup and Configuration

**New to security scanning?** See [Security Setup Guide](docs/SECURITY_SETUP.md) for step-by-step instructions to activate CodeQL, Snyk, and Dependabot.

### Reporting Vulnerabilities

Please report security vulnerabilities privately via [GitHub Security Advisories](https://github.com/kmcallorum/pytest-agents/security/advisories).

See [SECURITY.md](SECURITY.md) for complete security policy and disclosure guidelines.

## Documentation

See `docs/` directory for detailed documentation:

- [Release Process](docs/RELEASE.md) - Automated releases and versioning
- [Security Setup Guide](docs/SECURITY_SETUP.md) - Activate security scanning
- [Developer Guide](docs/developer-guide/README.md)
- [Architecture Overview](docs/developer-guide/architecture.md)
- [Python API Reference](docs/api/python-api.md)
- [TypeScript API Reference](docs/api/typescript-api.md)

## License

MIT

## Author

Kevin McAllorum
