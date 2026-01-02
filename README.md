# SuperClaude

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

```bash
# Install Python package
make install

# Or manually with uv
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

## Documentation

See `docs/` directory for detailed documentation:

- [Developer Guide](docs/developer-guide/README.md)
- [Architecture Overview](docs/developer-guide/architecture.md)
- [Python API Reference](docs/api/python-api.md)
- [TypeScript API Reference](docs/api/typescript-api.md)

## License

MIT

## Author

Kevin McAllorum
