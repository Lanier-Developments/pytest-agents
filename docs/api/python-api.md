# Python API Reference

Complete reference for SuperClaude's Python API.

## Table of Contents

- [Configuration](#configuration)
- [Agent Bridge](#agent-bridge)
- [CLI](#cli)
- [Pytest Integration](#pytest-integration)
- [Utilities](#utilities)

## Configuration

### `SuperClaudeConfig`

Dataclass for SuperClaude configuration management.

**Location**: `src/superclaude/config.py`

#### Class Definition

```python
@dataclass
class SuperClaudeConfig:
    # Agent configuration
    agent_pm_enabled: bool = True
    agent_research_enabled: bool = True
    agent_index_enabled: bool = True

    # Paths
    project_root: Path = field(default_factory=Path.cwd)
    agent_pm_path: Optional[Path] = None
    agent_research_path: Optional[Path] = None
    agent_index_path: Optional[Path] = None

    # Agent communication
    agent_timeout: int = 30
    agent_retry_count: int = 3

    # Logging
    log_level: str = "INFO"
    log_file: Optional[Path] = None

    # Feature flags
    enable_agent_caching: bool = True
    enable_parallel_agents: bool = False
```

#### Methods

##### `__post_init__()`

Automatically called after initialization to set default agent paths.

```python
def __post_init__(self) -> None:
    """Initialize paths after dataclass creation."""
```

##### `from_pytest_config(config)`

Create configuration from pytest config object.

**Parameters**:
- `config`: Pytest config object

**Returns**: `SuperClaudeConfig` instance

**Example**:
```python
def pytest_configure(config):
    sc_config = SuperClaudeConfig.from_pytest_config(config)
```

##### `from_env()`

Create configuration from environment variables.

**Environment Variables**:
- `SUPERCLAUDE_AGENT_PM_ENABLED`: Enable PM agent (default: "true")
- `SUPERCLAUDE_AGENT_RESEARCH_ENABLED`: Enable Research agent (default: "true")
- `SUPERCLAUDE_AGENT_INDEX_ENABLED`: Enable Index agent (default: "true")
- `SUPERCLAUDE_PROJECT_ROOT`: Project root directory (default: cwd)
- `SUPERCLAUDE_AGENT_TIMEOUT`: Agent timeout in seconds (default: "30")
- `SUPERCLAUDE_AGENT_RETRY_COUNT`: Agent retry count (default: "3")
- `SUPERCLAUDE_LOG_LEVEL`: Logging level (default: "INFO")
- `SUPERCLAUDE_ENABLE_AGENT_CACHING`: Enable caching (default: "true")
- `SUPERCLAUDE_ENABLE_PARALLEL_AGENTS`: Enable parallel execution (default: "false")

**Returns**: `SuperClaudeConfig` instance

**Example**:
```python
import os
os.environ['SUPERCLAUDE_AGENT_TIMEOUT'] = '60'
config = SuperClaudeConfig.from_env()
assert config.agent_timeout == 60
```

##### `to_dict()`

Convert configuration to dictionary.

**Returns**: `Dict[str, Any]` with all configuration values

**Example**:
```python
config = SuperClaudeConfig()
config_dict = config.to_dict()
print(config_dict['agent_timeout'])  # 30
```

## Agent Bridge

### `AgentClient`

Client for communicating with a single TypeScript agent.

**Location**: `src/superclaude/agent_bridge.py`

#### Constructor

```python
def __init__(self, name: str, agent_path: Path, timeout: int = 30) -> None:
    """Initialize agent client.

    Args:
        name: Agent name (pm, research, index)
        agent_path: Path to agent's index.js file
        timeout: Command timeout in seconds
    """
```

**Example**:
```python
from pathlib import Path
from superclaude.agent_bridge import AgentClient

client = AgentClient(
    name="pm",
    agent_path=Path("pm/dist/index.js"),
    timeout=30
)
```

#### Methods

##### `invoke(action, params=None)`

Invoke agent with specified action and parameters.

**Parameters**:
- `action` (str): Action to perform
- `params` (Optional[Dict[str, Any]]): Parameters for the action

**Returns**: `Dict[str, Any]` with structure:
```python
{
    "status": "success" | "error",
    "data": {...},
    "agent": "agent_name"
}
```

**Raises**:
- `RuntimeError`: If agent file doesn't exist

**Example**:
```python
response = client.invoke("list_tasks", {"path": "./src"})
if response["status"] == "success":
    tasks = response["data"]["tasks"]
```

### `AgentBridge`

Bridge for managing multiple TypeScript agents.

**Location**: `src/superclaude/agent_bridge.py`

#### Constructor

```python
def __init__(self, config: Optional[SuperClaudeConfig] = None) -> None:
    """Initialize agent bridge.

    Args:
        config: Optional configuration, defaults to environment config
    """
```

**Example**:
```python
from superclaude.agent_bridge import AgentBridge
from superclaude.config import SuperClaudeConfig

# With custom config
config = SuperClaudeConfig(agent_timeout=60)
bridge = AgentBridge(config)

# With default config
bridge = AgentBridge()
```

#### Methods

##### `invoke_agent(agent_name, action, params=None)`

Invoke a TypeScript agent via subprocess.

**Parameters**:
- `agent_name` (str): Name of agent to invoke (pm, research, index)
- `action` (str): Action to perform
- `params` (Optional[Dict[str, Any]]): Parameters for the action

**Returns**: `Dict[str, Any]` agent response

**Raises**:
- `ValueError`: If agent is not available

**Example**:
```python
bridge = AgentBridge()
result = bridge.invoke_agent("pm", "analyze_project", {"path": "./src"})
```

##### `get_available_agents()`

Get list of available agent names.

**Returns**: `list[str]` agent names

**Example**:
```python
bridge = AgentBridge()
agents = bridge.get_available_agents()  # ['pm', 'research', 'index']
```

##### `is_agent_available(agent_name)`

Check if an agent is available.

**Parameters**:
- `agent_name` (str): Agent name to check

**Returns**: `bool` - True if agent is available

**Example**:
```python
bridge = AgentBridge()
if bridge.is_agent_available("pm"):
    result = bridge.invoke_agent("pm", "ping")
```

## CLI

### Command Functions

**Location**: `src/superclaude/cli.py`

#### `main()`

Main CLI entry point.

**Returns**: `int` exit code (0 for success, 1 for error)

**Usage**:
```bash
superclaude --help
superclaude version
superclaude verify
superclaude agent pm list_tasks
```

#### `cmd_version(args)`

Print version information.

**Parameters**:
- `args`: argparse.Namespace

**Returns**: `int` exit code (always 0)

#### `cmd_verify(args)`

Verify installation and agent availability.

**Parameters**:
- `args`: argparse.Namespace

**Returns**: `int` exit code (0 if all checks pass, 1 otherwise)

**Output**:
```
SuperClaude v0.1.0
========================================

Project root: /app
Agent timeout: 30s

Available agents: pm, research, index

Testing agents...
  ✓ pm
  ✓ research
  ✓ index

All checks passed!
```

#### `cmd_doctor(args)`

Run diagnostic checks (alias for verify).

**Parameters**:
- `args`: argparse.Namespace

**Returns**: `int` exit code

#### `cmd_agent(args)`

Invoke an agent from command line.

**Parameters**:
- `args`: argparse.Namespace with:
  - `name`: Agent name
  - `action`: Action to perform
  - `params`: Optional JSON parameters
  - `json`: Output as JSON flag

**Returns**: `int` exit code (0 if success, 1 if error)

**Usage**:
```bash
# Human-readable output
superclaude agent pm list_tasks

# JSON output
superclaude agent pm list_tasks --json

# With parameters
superclaude agent pm analyze --params '{"path": "./src"}'
```

## Pytest Integration

### Hooks

**Location**: `src/superclaude/hooks.py`

#### `pytest_configure(config)`

Initialize SuperClaude plugin during pytest configuration.

**Called**: Automatically by pytest during startup

**Actions**:
- Creates SuperClaudeConfig from pytest config
- Initializes AgentBridge
- Stores in pytest config for access by tests

#### `pytest_collection_modifyitems(config, items)`

Modify test collection based on markers.

**Called**: Automatically by pytest during test collection

**Actions**:
- Validates marker usage
- Can skip tests based on agent availability

### Fixtures

**Location**: `src/superclaude/fixtures.py`

#### `superclaude_config`

Pytest fixture providing SuperClaude configuration.

**Scope**: Session

**Returns**: `SuperClaudeConfig` instance

**Example**:
```python
def test_config(superclaude_config):
    assert superclaude_config.agent_timeout == 30
```

#### `superclaude_agent`

Pytest fixture providing AgentBridge.

**Scope**: Session

**Returns**: `AgentBridge` instance

**Example**:
```python
def test_agent(superclaude_agent):
    result = superclaude_agent.invoke('pm', 'ping')
    assert result['status'] == 'success'
```

### Markers

**Location**: `src/superclaude/markers.py`

#### Custom Markers

- `@pytest.mark.unit` - Mark test as unit test
- `@pytest.mark.integration` - Mark test as integration test
- `@pytest.mark.agent_pm` - Mark test as requiring PM agent
- `@pytest.mark.agent_research` - Mark test as requiring Research agent
- `@pytest.mark.agent_index` - Mark test as requiring Index agent

**Example**:
```python
import pytest

@pytest.mark.unit
def test_basic():
    assert True

@pytest.mark.integration
@pytest.mark.agent_pm
def test_pm_integration(superclaude_agent):
    result = superclaude_agent.invoke('pm', 'ping')
    assert result['status'] == 'success'
```

## Utilities

### Logging

**Location**: `src/superclaude/utils/logging.py`

#### `setup_logger(name, level=None, log_file=None)`

Set up a logger with consistent formatting.

**Parameters**:
- `name` (str): Logger name (typically `__name__`)
- `level` (Optional[str]): Log level (DEBUG, INFO, WARNING, ERROR)
- `log_file` (Optional[Path]): Optional log file path

**Returns**: `logging.Logger` instance

**Example**:
```python
from superclaude.utils.logging import setup_logger

logger = setup_logger(__name__, level="DEBUG")
logger.info("Application started")
logger.debug("Debug information")
```

### Validation

**Location**: `src/superclaude/utils/validation.py`

#### `validate_json(text)`

Validate and parse JSON text.

**Parameters**:
- `text` (str): JSON text to validate

**Returns**: `Optional[Dict[str, Any]]` - Parsed JSON or None if invalid

**Example**:
```python
from superclaude.utils.validation import validate_json

result = validate_json('{"status": "success"}')
if result:
    print(result["status"])
```

#### `validate_agent_response(data)`

Validate agent response structure.

**Parameters**:
- `data` (Dict[str, Any]): Response data to validate

**Returns**: `bool` - True if valid structure

**Expected Structure**:
```python
{
    "status": "success" | "error",
    "data": {...}
}
```

**Example**:
```python
from superclaude.utils.validation import validate_agent_response

response = {"status": "success", "data": {"result": "ok"}}
if validate_agent_response(response):
    print("Valid response")
```

## Complete Usage Example

```python
"""Complete example of using SuperClaude Python API."""

import pytest
from pathlib import Path
from superclaude.agent_bridge import AgentBridge
from superclaude.config import SuperClaudeConfig

# Configure SuperClaude
config = SuperClaudeConfig(
    project_root=Path.cwd(),
    agent_timeout=60,
    log_level="DEBUG"
)

# Initialize agent bridge
bridge = AgentBridge(config)

# Check available agents
available = bridge.get_available_agents()
print(f"Available agents: {', '.join(available)}")

# Invoke PM agent
if bridge.is_agent_available("pm"):
    result = bridge.invoke_agent(
        "pm",
        "analyze_project",
        {"path": "./src"}
    )

    if result["status"] == "success":
        print("Analysis successful")
        print(result["data"])
    else:
        print(f"Error: {result['data']['error']}")

# Use in pytest
@pytest.mark.integration
@pytest.mark.agent_pm
def test_pm_agent(superclaude_agent):
    """Test PM agent integration."""
    result = superclaude_agent.invoke('pm', 'ping')
    assert result['status'] == 'success'
    assert result['agent'] == 'pm'

@pytest.mark.unit
def test_config(superclaude_config):
    """Test configuration."""
    assert superclaude_config.agent_timeout > 0
    assert superclaude_config.project_root.exists()
```

## Type Hints

SuperClaude uses type hints throughout. Key types:

```python
from typing import Any, Dict, Optional
from pathlib import Path

# Agent response type
AgentResponse = Dict[str, Any]  # {"status": str, "data": Dict, "agent": str}

# Agent parameters type
AgentParams = Optional[Dict[str, Any]]

# Configuration types
LogLevel = str  # "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"
AgentName = str  # "pm" | "research" | "index"
```

## Error Handling

All API functions handle errors gracefully:

```python
try:
    result = bridge.invoke_agent("pm", "action")
except ValueError as e:
    # Agent not available
    print(f"Agent error: {e}")
except RuntimeError as e:
    # Agent execution error
    print(f"Runtime error: {e}")
except Exception as e:
    # Unexpected error
    print(f"Unexpected error: {e}")
```

Agent responses include error information:

```python
result = bridge.invoke_agent("pm", "action")
if result["status"] == "error":
    error_msg = result["data"]["error"]
    print(f"Agent error: {error_msg}")
```

## Next Steps

- Explore [TypeScript API Reference](typescript-api.md)
- Review [Architecture Overview](../developer-guide/architecture.md)
- Read [Developer Guide](../developer-guide/README.md)
