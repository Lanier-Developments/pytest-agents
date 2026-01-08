# pytest-agents

[![CI](https://github.com/kmcallorum/pytest-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/kmcallorum/pytest-agents/actions/workflows/ci.yml)
[![CodeQL](https://github.com/kmcallorum/pytest-agents/actions/workflows/codeql.yml/badge.svg)](https://github.com/kmcallorum/pytest-agents/actions/workflows/codeql.yml)
[![Release](https://github.com/kmcallorum/pytest-agents/actions/workflows/release.yml/badge.svg)](https://github.com/kmcallorum/pytest-agents/actions/workflows/release.yml)
[![GitHub Release](https://img.shields.io/github/v/release/kmcallorum/pytest-agents)](https://github.com/kmcallorum/pytest-agents/releases)
[![PyPI](https://img.shields.io/pypi/v/pytest-agents)](https://pypi.org/project/pytest-agents/)
[![Security Policy](https://img.shields.io/badge/security-policy-blue.svg)](SECURITY.md)
[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![codecov](https://codecov.io/gh/kmcallorum/pytest-agents/branch/main/graph/badge.svg)](https://codecov.io/gh/kmcallorum/pytest-agents)
[![Tests](https://img.shields.io/badge/tests-182%20passed-brightgreen.svg)](https://github.com/kmcallorum/pytest-agents)
[![Metrics](https://img.shields.io/badge/metrics-prometheus-blue.svg)](docs/METRICS.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](docs/DOCKER.md)
[![Code Style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

A pytest plugin framework with AI agent capabilities for project management, research, and code indexing.

## Quick Start

```bash
# Install from PyPI
pip install pytest-agents

# Verify installation
pytest-agents verify
```

## Features

- **Pytest Plugin**: Extended pytest with custom markers and AI agent integration
- **PM Agent**: TypeScript-based project management agent for task tracking and planning
- **Research Agent**: AI-powered research and documentation analysis
- **Index Agent**: Code indexing and intelligent search capabilities
- **Prometheus Metrics**: Comprehensive observability with metrics collection and HTTP endpoint
- **Dependency Injection**: Full DI implementation across Python and TypeScript components
- **Skills System**: Extensible runtime skills for specialized tasks

## Quick Start

### Installation

**From PyPI (Recommended):**
```bash
pip install pytest-agents
```

**From Docker:**
```bash
docker pull ghcr.io/kmcallorum/pytest-agents:latest
docker run ghcr.io/kmcallorum/pytest-agents:latest pytest-agents verify
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
├── src/pytest_agents/   # Python pytest plugin package
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
def test_with_pm_agent(pytest_agents_agent):
    result = pytest_agents_agent.invoke('pm', 'analyze_project')
    assert result['status'] == 'success'
```

### Parallel Agent Execution

Run multiple agents concurrently for faster test execution:

```python
def test_multi_agent_parallel(agent_coordinator):
    """Run multiple agents in parallel."""
    results = agent_coordinator.run_parallel([
        ('pm', 'track_tasks', {'path': './src'}),
        ('research', 'analyze_document', {'path': 'README.md'}),
        ('index', 'index_repository', {'path': './src'})
    ])

    assert all(r['status'] == 'success' for r in results)
```

### Invoking Agents

```python
# Via Python API
from pytest_agents.agent_bridge import AgentBridge

bridge = AgentBridge()
result = bridge.invoke_agent('pm', 'track_tasks', {'path': './src'})
```

```bash
# Via CLI
pytest-agents agent pm --action track_tasks --path ./src
```

### Metrics and Observability

```bash
# Start Prometheus metrics server
pytest-agents metrics

# Custom port
pytest-agents metrics --port 8080

# Configure via environment
export PYTEST_AGENTS_METRICS_ENABLED=true
export PYTEST_AGENTS_METRICS_PORT=9090
```

View metrics at `http://localhost:9090/metrics`. See [Metrics Documentation](docs/METRICS.md) for Prometheus and Grafana integration.

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

pytest-agents is fully containerized for easy deployment and development.

### Quick Start with Docker

```bash
# Build and run verification
docker-compose up pytest-agents

# Run tests in Docker
docker-compose --profile test up pytest-agents-test

# Start development shell
docker-compose --profile dev run pytest-agents-dev
```

See [Docker Documentation](docs/DOCKER.md) for complete deployment guide.

## Security

pytest-agents implements enterprise-grade security practices:

### Automated Security Scanning

- **CodeQL**: Static analysis detecting 400+ security vulnerabilities in Python and TypeScript
- **Snyk Security**: Continuous vulnerability scanning for dependencies and containers
- **Dependency Scanning**: Automated vulnerability detection via Dependabot
- **Container Scanning**: Docker image vulnerability assessment
- **Code Quality**: Ruff linting with security-focused rules

### Security Features

- Multi-stage Docker builds with minimal attack surface
- Dependency pinning for reproducible builds
- Comprehensive test coverage (61%, 230 tests)
- Automated security updates grouped by severity

### Setup and Configuration

**New to security scanning?** See [Security Setup Guide](docs/SECURITY_SETUP.md) for step-by-step instructions to activate Snyk and Dependabot.

### Reporting Vulnerabilities

Please report security vulnerabilities privately via [GitHub Security Advisories](https://github.com/kmcallorum/pytest-agents/security/advisories).

See [SECURITY.md](SECURITY.md) for complete security policy and disclosure guidelines.

## Documentation

See `docs/` directory for detailed documentation:

- [Metrics Guide](docs/METRICS.md) - Prometheus metrics and observability
- [Performance Benchmarks](docs/BENCHMARKS.md) - Performance baselines and optimization
- [Release Process](docs/RELEASE.md) - Automated releases and versioning
- [PyPI Publishing Setup](docs/PYPI_SETUP.md) - Configure PyPI trusted publishing
- [Security Setup Guide](docs/SECURITY_SETUP.md) - Activate security scanning
- [Docker Guide](docs/DOCKER.md) - Container deployment and development
- [Developer Guide](docs/developer-guide/README.md) - Development workflow
- [Architecture Overview](docs/developer-guide/architecture.md) - System design
- [Python API Reference](docs/api/python-api.md) - Python API documentation
- [TypeScript API Reference](docs/api/typescript-api.md) - TypeScript API documentation

## License

MIT

## Author

Kevin McAllorum
# Security scanning now enabled!
