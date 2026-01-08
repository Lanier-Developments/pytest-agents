# pytest-agents Tutorial

A step-by-step guide to using pytest-agents for AI-powered test automation and project management.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Using Custom Markers](#using-custom-markers)
4. [Working with Agents](#working-with-agents)
5. [Fixtures and Helpers](#fixtures-and-helpers)
6. [CLI Commands](#cli-commands)
7. [Advanced Usage](#advanced-usage)

---

## Installation

### From PyPI (Recommended)

```bash
pip install pytest-agents
```

### From Source

```bash
git clone https://github.com/kmcallorum/pytest-agents.git
cd pytest-agents
pip install -e ".[dev]"
```

### Verify Installation

```bash
pytest-agents verify
```

You should see:
```
✓ Python package installed
✓ Pytest plugin loaded
✓ All 3 agents available (pm, research, index)
```

---

## Quick Start

### 1. Your First Test with pytest-agents

Create a file `test_example.py`:

```python
import pytest

@pytest.mark.unit
def test_basic_functionality():
    """A simple test marked as 'unit'."""
    assert 1 + 1 == 2

@pytest.mark.integration
@pytest.mark.agent_pm
def test_with_pm_agent(pytest_agents_agent):
    """Test that uses the PM agent."""
    result = pytest_agents_agent.invoke_agent('pm', 'ping', {})
    assert result['status'] == 'success'
```

### 2. Run Your Tests

```bash
pytest test_example.py -v
```

Output:
```
test_example.py::test_basic_functionality PASSED
test_example.py::test_with_pm_agent PASSED
```

---

## Using Custom Markers

pytest-agents provides several built-in markers for organizing your tests:

### Available Markers

| Marker | Description | Example |
|--------|-------------|---------|
| `@pytest.mark.unit` | Unit tests | Fast, isolated tests |
| `@pytest.mark.integration` | Integration tests | Tests with external dependencies |
| `@pytest.mark.e2e` | End-to-end tests | Full workflow tests |
| `@pytest.mark.agent_pm` | Uses PM agent | Project management tasks |
| `@pytest.mark.agent_research` | Uses Research agent | Documentation analysis |
| `@pytest.mark.agent_index` | Uses Index agent | Code indexing/search |
| `@pytest.mark.slow` | Slow tests | Tests taking >1 second |

### Example: Organizing Tests by Type

```python
import pytest

@pytest.mark.unit
def test_calculator_add():
    """Fast unit test."""
    assert 2 + 2 == 4

@pytest.mark.integration
@pytest.mark.slow
def test_database_connection():
    """Slower integration test."""
    # Test database connectivity
    pass

@pytest.mark.e2e
@pytest.mark.agent_pm
def test_full_workflow(pytest_agents_agent):
    """End-to-end test using PM agent."""
    # Test complete workflow
    pass
```

### Running Tests by Marker

```bash
# Run only unit tests
pytest -m unit

# Run integration tests
pytest -m integration

# Run tests that use the PM agent
pytest -m agent_pm

# Run fast tests (exclude slow ones)
pytest -m "not slow"

# Combine markers
pytest -m "unit and not slow"
```

---

## Working with Agents

pytest-agents includes three TypeScript agents for different tasks:

### PM Agent (Project Management)

Track tasks, create milestones, analyze dependencies.

```python
import pytest

@pytest.mark.agent_pm
def test_track_project_tasks(pytest_agents_agent):
    """Use PM agent to track TODOs in your codebase."""
    result = pytest_agents_agent.invoke_agent(
        'pm',
        'track_tasks',
        {'path': './src'}
    )

    assert result['status'] == 'success'
    tasks = result['data']['tasks']
    print(f"Found {len(tasks)} tasks")
```

### Research Agent (Documentation Analysis)

Analyze documentation, extract insights, generate summaries.

```python
import pytest

@pytest.mark.agent_research
def test_analyze_readme(pytest_agents_agent):
    """Use Research agent to analyze README."""
    result = pytest_agents_agent.invoke_agent(
        'research',
        'analyze_document',
        {'path': 'README.md'}
    )

    assert result['status'] == 'success'
    analysis = result['data']
    print(f"Document analysis: {analysis}")
```

### Index Agent (Code Indexing)

Index codebases, search code, find symbols.

```python
import pytest

@pytest.mark.agent_index
def test_index_codebase(pytest_agents_agent):
    """Use Index agent to index and search code."""
    # Index the repository
    result = pytest_agents_agent.invoke_agent(
        'index',
        'index_repository',
        {'path': './src'}
    )
    assert result['status'] == 'success'

    # Search for a function
    search_result = pytest_agents_agent.invoke_agent(
        'index',
        'search',
        {'query': 'setup_logger'}
    )
    assert 'results' in search_result['data']
```

---

## Fixtures and Helpers

### Available Fixtures

#### `pytest_agents_config`

Access pytest-agents configuration:

```python
def test_config(pytest_agents_config):
    """Access configuration."""
    assert pytest_agents_config.agent_timeout == 30
    assert pytest_agents_config.project_root.exists()
```

#### `pytest_agents_agent`

The main fixture for invoking agents:

```python
def test_agent_bridge(pytest_agents_agent):
    """Use agent bridge."""
    # Get available agents
    agents = pytest_agents_agent.get_available_agents()
    assert 'pm' in agents
    assert 'research' in agents
    assert 'index' in agents

    # Check if specific agent is available
    assert pytest_agents_agent.is_agent_available('pm')
```

#### `project_context`

Get metadata about your project:

```python
def test_project_context(project_context):
    """Access project metadata."""
    print(f"Project root: {project_context['root_path']}")
    print(f"Test name: {project_context['test_name']}")
    print(f"Markers: {project_context['markers']}")
```

#### `agent_coordinator`

Run multiple agents in parallel:

```python
def test_multi_agent_parallel(agent_coordinator):
    """Run multiple agents concurrently."""
    results = agent_coordinator.run_parallel([
        ('pm', 'track_tasks', {'path': './src'}),
        ('research', 'analyze_document', {'path': 'README.md'}),
        ('index', 'index_repository', {'path': './src'})
    ])

    assert len(results) == 3
    assert all(r['status'] == 'success' for r in results)
```

---

## CLI Commands

pytest-agents provides several CLI commands for non-test usage:

### Verify Installation

```bash
pytest-agents verify
```

Checks:
- Python package installed correctly
- Pytest plugin loaded
- All agents available and working

### Invoke Agents Directly

```bash
# Ping an agent
pytest-agents agent pm --action ping

# Track tasks
pytest-agents agent pm --action track_tasks --params '{"path": "./src"}'

# Get JSON output
pytest-agents agent pm --action ping --json
```

### Start Metrics Server

```bash
# Start Prometheus metrics server (default port 9090)
pytest-agents metrics

# Custom port
pytest-agents metrics --port 8080

# Access metrics at http://localhost:9090/metrics
```

### Check Health

```bash
pytest-agents doctor
```

Runs comprehensive health checks:
- Python installation
- Pytest plugin
- TypeScript agent builds
- All dependencies

---

## Advanced Usage

### Custom Configuration

Configure pytest-agents in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
markers = [
    "unit: Unit tests",
    "integration: Integration tests",
]

# pytest-agents configuration
pytest_agents_agent_timeout = 30
pytest_agents_agent_retry_count = 3
pytest_agents_log_level = "INFO"
```

Or via environment variables:

```bash
export PYTEST_AGENTS_AGENT_TIMEOUT=60
export PYTEST_AGENTS_LOG_LEVEL=DEBUG
pytest
```

### Parallel Agent Execution

```python
import pytest

def test_parallel_agents(agent_coordinator):
    """Execute multiple agents simultaneously."""
    tasks = [
        ('pm', 'track_tasks', {'path': './src'}),
        ('pm', 'track_tasks', {'path': './tests'}),
        ('research', 'analyze_document', {'path': 'docs/guide.md'}),
        ('index', 'index_repository', {'path': './src'}),
    ]

    results = agent_coordinator.run_parallel(tasks, max_workers=4)

    # All tasks complete, check results
    for i, result in enumerate(results):
        print(f"Task {i}: {result['status']}")
```

### Error Handling

```python
import pytest

@pytest.mark.agent_pm
def test_agent_error_handling(pytest_agents_agent):
    """Handle agent errors gracefully."""
    try:
        result = pytest_agents_agent.invoke_agent(
            'pm',
            'invalid_action',
            {}
        )
        # Check for error status
        if result['status'] == 'error':
            error_msg = result['data']['error']
            print(f"Expected error: {error_msg}")
    except Exception as e:
        pytest.fail(f"Unexpected exception: {e}")
```

### Performance Benchmarking

```python
import pytest

@pytest.mark.performance
def test_agent_performance(benchmark, pytest_agents_agent):
    """Benchmark agent invocation speed."""

    def invoke_agent():
        return pytest_agents_agent.invoke_agent('pm', 'ping', {})

    result = benchmark(invoke_agent)
    assert result['status'] == 'success'
```

Run benchmarks:

```bash
pytest -m performance --benchmark-only
```

### Using with CI/CD

Example GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install pytest-agents
        run: pip install pytest-agents

      - name: Run tests
        run: pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

---

## Next Steps

- Check out [API Documentation](api/python-api.md) for detailed API reference
- See [Metrics Guide](METRICS.md) for observability setup
- Read [Architecture Overview](developer-guide/architecture.md) to understand internals
- Join discussions at https://github.com/kmcallorum/pytest-agents/discussions

---

## Troubleshooting

### Agent Not Available

```python
# Check which agents are loaded
def test_check_agents(pytest_agents_agent):
    agents = pytest_agents_agent.get_available_agents()
    print(f"Available agents: {agents}")
```

### Timeout Issues

Increase timeout in config:

```python
# In conftest.py
import pytest
from pytest_agents.config import PytestAgentsConfig

@pytest.fixture(scope="session")
def pytest_agents_config():
    config = PytestAgentsConfig.from_env()
    config.agent_timeout = 60  # Increase to 60 seconds
    return config
```

### TypeScript Build Errors

Rebuild agents:

```bash
cd pm && npm install && npm run build
cd ../research && npm install && npm run build
cd ../index && npm install && npm run build
```

---

**Questions or Issues?**
- Report bugs: https://github.com/kmcallorum/pytest-agents/issues
- Ask questions: https://github.com/kmcallorum/pytest-agents/discussions
