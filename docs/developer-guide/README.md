# Developer Guide

Welcome to the pytest-agents developer guide. This guide will help you understand how to develop, test, and contribute to the pytest-agents project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Code Style](#code-style)
- [Contributing](#contributing)

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 20 or higher
- Docker (optional, for containerized development)
- uv (Python package manager)

### Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/kmcallorum/pytest-agents.git
cd pytest-agents
```

2. Install dependencies:
```bash
make install
```

This will:
- Install Python dependencies using uv
- Install Node.js dependencies for all TypeScript agents
- Build TypeScript agents

3. Verify installation:
```bash
make verify
```

## Development Workflow

### Python Development

pytest-agents uses modern Python tooling:

- **uv**: Fast Python package installer and resolver
- **pytest**: Testing framework with custom plugin support
- **Ruff**: Fast Python linter and formatter
- **Coverage.py**: Code coverage tracking

#### Making Changes to Python Code

1. Make your changes in `src/pytest-agents/`
2. Format code: `make format`
3. Lint code: `make lint`
4. Run tests: `make test-python`
5. Check coverage: `uv run coverage report`

### TypeScript Development

The project includes three TypeScript agents:

- **PM Agent**: Project management and task tracking
- **Research Agent**: Documentation analysis and research
- **Index Agent**: Code indexing and search

#### Making Changes to TypeScript Code

1. Navigate to the agent directory (`pm/`, `research/`, or `index/`)
2. Make your changes in `src/`
3. Build: `npm run build`
4. Test: `npm test`
5. Check types: `npm run type-check` (if available)

### Building Everything

To build all components:
```bash
make build
```

Or build individually:
```bash
# Python only
make install

# TypeScript only
cd pm && npm run build
cd research && npm run build
cd index && npm run build
```

## Project Structure

```
pytest-agents/
├── src/pytest-agents/          # Python package
│   ├── __init__.py           # Package initialization
│   ├── plugin.py             # Pytest plugin entry point
│   ├── hooks.py              # Pytest hooks implementation
│   ├── config.py             # Configuration management
│   ├── agent_bridge.py       # Python-TypeScript bridge
│   ├── cli.py                # CLI commands
│   ├── fixtures.py           # Pytest fixtures
│   ├── markers.py            # Custom pytest markers
│   └── utils/                # Utility modules
│       ├── logging.py        # Logging setup
│       └── validation.py     # Validation helpers
├── tests/                    # Test suite
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── pm/                       # PM agent (TypeScript)
│   ├── src/                  # Source code
│   └── __tests__/            # Tests
├── research/                 # Research agent (TypeScript)
│   ├── src/                  # Source code
│   └── __tests__/            # Tests
├── index/                    # Index agent (TypeScript)
│   ├── src/                  # Source code
│   └── __tests__/            # Tests
├── docs/                     # Documentation
├── Dockerfile                # Docker image definition
├── docker-compose.yml        # Docker orchestration
├── pyproject.toml            # Python project config
├── uv.lock                   # Python dependency lock
└── Makefile                  # Development commands
```

For detailed architecture information, see [Architecture Overview](architecture.md).

## Testing

### Running Tests

```bash
# All tests (Python + TypeScript)
make test

# Python tests only
make test-python

# Specific test file
uv run pytest tests/unit/test_config.py -v

# With coverage
uv run pytest --cov=src/pytest-agents --cov-report=html

# TypeScript tests
cd pm && npm test
cd research && npm test
cd index && npm test
```

### Writing Tests

#### Python Tests

pytest-agents uses pytest with custom markers. Place tests in `tests/unit/` or `tests/integration/`.

Example unit test:
```python
import pytest
from pytest_agents.config import pytest-agentsConfig

@pytest.mark.unit
class Testpytest-agentsConfig:
    def test_default_initialization(self) -> None:
        config = pytest-agentsConfig()
        assert config.agent_timeout == 30
```

Example integration test:
```python
import pytest

@pytest.mark.integration
@pytest.mark.agent_pm
def test_pm_agent_integration(pytest_agents_agent):
    result = pytest_agents_agent.invoke('pm', 'ping')
    assert result['status'] == 'success'
```

#### TypeScript Tests

Use Jest for TypeScript tests. Place tests in `__tests__/` directories.

Example test:
```typescript
import { PMAgent } from '../src/agent';

describe('PMAgent', () => {
  it('should initialize correctly', () => {
    const agent = new PMAgent();
    expect(agent).toBeDefined();
  });
});
```

### Coverage Goals

- Target: 80% overall coverage
- Minimum: 70% for new features
- Critical modules: 90%+ (config, agent_bridge, cli)

## Code Style

### Python

- **Style Guide**: PEP 8
- **Formatter**: Black (line length: 88)
- **Linter**: Ruff
- **Type Hints**: Required for public APIs
- **Docstrings**: Google style for public functions/classes

Example:
```python
def invoke_agent(
    agent_name: str, action: str, params: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Invoke a TypeScript agent via subprocess.

    Args:
        agent_name: Name of agent to invoke (pm, research, index)
        action: Action to perform
        params: Optional parameters for the action

    Returns:
        Dict[str, Any]: Agent response

    Raises:
        ValueError: If agent is not available
    """
```

### TypeScript

- **Style Guide**: StandardJS-like
- **Formatter**: Prettier
- **Linter**: ESLint
- **Type Safety**: Strict mode enabled

Example:
```typescript
export interface AgentResponse {
  status: 'success' | 'error';
  data: Record<string, unknown>;
  agent: string;
}
```

### Running Formatters/Linters

```bash
# Python
make format  # Format with Black
make lint    # Lint with Ruff

# TypeScript
cd pm && npm run lint
cd pm && npm run format
```

## Contributing

### Commit Messages

Follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

Examples:
```
feat(agent): add retry logic to agent invocations
fix(cli): handle JSON parsing errors gracefully
docs: update Docker deployment guide
test(config): add comprehensive environment variable tests
```

### Pull Request Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes following code style guidelines
3. Add/update tests
4. Ensure all tests pass: `make test`
5. Ensure coverage doesn't decrease
6. Run linters: `make lint format`
7. Commit with conventional commit messages
8. Push and create a pull request
9. Wait for CI checks to pass
10. Request review

### Development Tools

Useful make targets:
```bash
make install     # Install all dependencies
make build       # Build all components
make test        # Run all tests
make lint        # Run linters
make format      # Format code
make doctor      # Run health checks
make verify      # Verify installation
make clean       # Clean build artifacts
```

## Troubleshooting

### Common Issues

**Tests failing after changes:**
```bash
# Clear pytest cache
rm -rf .pytest_cache

# Reinstall in editable mode
make install
```

**TypeScript build errors:**
```bash
# Clean and rebuild
cd pm && rm -rf dist node_modules && npm install && npm run build
```

**Coverage not updating:**
```bash
# Remove coverage files
rm -rf .coverage htmlcov/

# Run tests fresh
uv run pytest --cov=src/pytest-agents --cov-report=html
```

### Getting Help

- Check existing [issues](https://github.com/kmcallorum/pytest-agents/issues)
- Review [architecture documentation](architecture.md)
- Read API documentation: [Python](../api/python-api.md) | [TypeScript](../api/typescript-api.md)

## Next Steps

- Review [Architecture Overview](architecture.md)
- Explore [Python API Reference](../api/python-api.md)
- Explore [TypeScript API Reference](../api/typescript-api.md)
- Try [Docker deployment](../DOCKER.md)
