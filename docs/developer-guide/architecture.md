# Architecture Overview

This document provides a high-level overview of the pytest-agents architecture, including its components, data flow, and design decisions.

## System Architecture

pytest-agents is a hybrid Python-TypeScript system that extends pytest with AI agent capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                      pytest-agents System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌─────────────────────────────┐   │
│  │   Pytest     │◄────────┤   pytest-agents Plugin        │   │
│  │   Runtime    │         │   (hooks.py, plugin.py)     │   │
│  └──────────────┘         └─────────────┬───────────────┘   │
│                                          │                    │
│                           ┌──────────────▼──────────────┐    │
│                           │      Agent Bridge           │    │
│                           │   (agent_bridge.py)         │    │
│                           └──────────┬─────────┬────────┘    │
│                                      │         │              │
│                   ┌──────────────────┼─────────┼─────────┐   │
│                   │                  │         │         │   │
│              ┌────▼────┐      ┌─────▼──┐  ┌──▼──────┐  │   │
│              │   PM    │      │Research│  │  Index  │  │   │
│              │  Agent  │      │ Agent  │  │  Agent  │  │   │
│              │  (TS)   │      │  (TS)  │  │  (TS)   │  │   │
│              └─────────┘      └────────┘  └─────────┘  │   │
│                                                          │   │
└──────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Pytest Plugin (`plugin.py`, `hooks.py`)

**Purpose**: Integrate pytest-agents into pytest's lifecycle

**Key Responsibilities**:
- Register custom pytest markers (unit, integration, agent_pm, agent_research, agent_index)
- Initialize pytest-agents configuration from pytest config
- Provide pytest fixtures for agent access
- Hook into pytest test collection and execution

**Key Files**:
- `src/pytest-agents/plugin.py` - Plugin registration
- `src/pytest-agents/hooks.py` - Pytest hook implementations
- `src/pytest-agents/markers.py` - Custom marker definitions
- `src/pytest-agents/fixtures.py` - Pytest fixtures

### 2. Configuration Management (`config.py`)

**Purpose**: Centralized configuration for the entire system

**Features**:
- Environment variable support (PYTEST_AGENTS_*)
- Pytest configuration integration
- Dataclass-based configuration with validation
- Agent path auto-discovery

**Configuration Sources** (in priority order):
1. Explicit parameters
2. pytest.ini / pyproject.toml
3. Environment variables
4. Defaults

**Example**:
```python
config = pytest-agentsConfig(
    agent_pm_enabled=True,
    agent_timeout=30,
    log_level="INFO"
)
```

### 3. Agent Bridge (`agent_bridge.py`)

**Purpose**: Bridge between Python and TypeScript agents

**Architecture**:
```
Python (pytest)
      │
      ├─► AgentBridge
      │      ├─► AgentClient (PM)
      │      │      └─► subprocess.run(['node', 'pm/dist/index.js'])
      │      │
      │      ├─► AgentClient (Research)
      │      │      └─► subprocess.run(['node', 'research/dist/index.js'])
      │      │
      │      └─► AgentClient (Index)
      │             └─► subprocess.run(['node', 'index/dist/index.js'])
      │
      ▼
TypeScript Agents (Node.js)
```

**Communication Protocol**:
- **Request**: JSON via stdin
  ```json
  {
    "action": "list_tasks",
    "params": {"path": "./src"}
  }
  ```

- **Response**: JSON via stdout
  ```json
  {
    "status": "success",
    "data": {"tasks": [...]},
    "agent": "pm"
  }
  ```

**Error Handling**:
- Subprocess timeouts (configurable)
- Invalid JSON responses
- Agent not found errors
- Retry logic (configurable)

### 4. CLI Interface (`cli.py`)

**Purpose**: Command-line interface for pytest-agents

**Commands**:
- `pytest-agents version` - Show version
- `pytest-agents verify` - Verify installation
- `pytest-agents doctor` - Run diagnostics
- `pytest-agents agent <name> <action>` - Invoke agent

**Design**:
- Built with argparse
- Subcommand architecture
- JSON and human-readable output modes
- Exit codes for scripting

### 5. TypeScript Agents

Each agent is a standalone TypeScript/Node.js application.

**Common Structure**:
```
agent/
├── src/
│   ├── agent.ts          # Main agent class
│   ├── index.ts          # Entry point (reads stdin)
│   ├── types.ts          # Type definitions
│   ├── capabilities/     # Agent-specific features
│   ├── tools/            # Helper tools
│   ├── memory/           # State management
│   └── utils/            # Utilities
├── __tests__/            # Jest tests
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

**Agent Types**:

#### PM Agent
- **Purpose**: Project management and task tracking
- **Capabilities**: Task parsing, dependency analysis, milestone planning
- **Tools**: Task parser
- **State**: Project state persistence

#### Research Agent
- **Purpose**: Documentation analysis and research
- **Capabilities**: Document analysis, citation tracking
- **Tools**: Summarizer, source evaluator
- **State**: Knowledge graph, research cache

#### Index Agent
- **Purpose**: Code indexing and search
- **Capabilities**: Code indexing, symbol mapping
- **Tools**: AST parser, search builder
- **State**: Index storage

## Data Flow

### Test Execution Flow

```
1. pytest starts
   │
2. pytest-agents plugin initializes
   ├─► Load configuration
   ├─► Initialize AgentBridge
   └─► Register fixtures
   │
3. Test collection
   ├─► Discover tests with markers
   └─► Validate marker usage
   │
4. Test execution
   │
5. Test needs agent (uses fixture)
   │
6. AgentBridge.invoke_agent(name, action, params)
   ├─► Find AgentClient for name
   ├─► Validate agent exists
   └─► AgentClient.invoke(action, params)
       │
       ├─► Build JSON request
       ├─► Spawn subprocess (node agent.js)
       ├─► Send request via stdin
       ├─► Read response from stdout
       ├─► Parse and validate JSON
       └─► Return response
   │
7. Test continues with agent response
   │
8. Test completes
```

### Agent Invocation Flow

```
Python Side                 Process Boundary          TypeScript Side
───────────                ──────────────────         ────────────────

AgentClient.invoke()
    │
    ├─► Create request JSON
    │
    ├─► subprocess.run([
    │       'node',
    │       'agent/dist/index.js'
    │   ])
    │                           ───────────────►      index.ts starts
    │                                                      │
    │   Write to stdin                                     │
    ├─────────────────────────────────────────────►  Read from stdin
    │                                                      │
    │                                                 Parse JSON
    │                                                      │
    │                                                 Agent.handle(action, params)
    │                                                      │
    │                                                 Execute action
    │                                                      │
    │                                                 Build response
    │                                                      │
    │   Read from stdout    ◄─────────────────────── Write to stdout
    │                                                      │
    ├─► Parse response JSON                           Process exits
    │
    └─► Return response
```

## Design Decisions

### Why Python + TypeScript?

**Python**:
- Natural fit for pytest plugin
- Excellent testing ecosystem
- Familiar to Python developers

**TypeScript**:
- Type safety for complex agent logic
- Modern async/await for I/O
- NPM ecosystem for AI/ML tools
- Easy to extend with new capabilities

### Why Subprocess Communication?

**Alternatives Considered**:
1. HTTP API - Too heavyweight, adds latency
2. gRPC - Complex setup, overkill for simple IPC
3. Shared library (PyO3/NAPI) - Complex build, platform-specific

**Chosen: Subprocess with JSON over stdin/stdout**
- Simple and robust
- Language agnostic
- Easy to debug (can run manually)
- No external dependencies
- Process isolation (crash safety)

### Why Dataclasses for Config?

- Type safety
- Auto-generated `__init__`, `__repr__`
- Immutability option
- IDE autocomplete support
- Validation via `__post_init__`

### Plugin Architecture

pytest-agents uses pytest's plugin system:

```python
# Entry point in pyproject.toml
[project.entry-points.pytest11]
pytest-agents = "pytest-agents.plugin"
```

This allows:
- Automatic discovery by pytest
- Clean separation from test code
- Reusable fixtures and markers
- Hook into pytest lifecycle

## Extensibility

### Adding a New Agent

1. Create agent directory with TypeScript structure
2. Implement standard interface (action/params → response)
3. Add agent path to configuration
4. Register in AgentBridge initialization
5. Add pytest marker if needed

Example:
```python
# In config.py
agent_newagent_enabled: bool = True
agent_newagent_path: Optional[Path] = None

# In agent_bridge.py
if self.config.agent_newagent_enabled and self.config.agent_newagent_path:
    self.agents["newagent"] = AgentClient(
        "newagent",
        self.config.agent_newagent_path,
        self.config.agent_timeout
    )
```

### Adding New Actions to Existing Agent

Simply implement in the agent's TypeScript code:

```typescript
// In agent.ts
async handle(action: string, params: any): Promise<AgentResponse> {
  switch (action) {
    case 'existing_action':
      return this.existingAction(params);
    case 'new_action':  // ← Add new action
      return this.newAction(params);
    default:
      return { status: 'error', data: { error: 'Unknown action' }};
  }
}
```

### Adding Custom Markers

```python
# In markers.py
MARKERS = {
    # ... existing markers ...
    "agent_newagent": "Mark test as requiring the newagent agent",
}
```

## Performance Considerations

### Agent Startup Time
- **Issue**: Spawning Node.js process has ~100-200ms overhead
- **Mitigation**:
  - Future: Agent daemon mode with persistent processes
  - Current: Minimize agent invocations per test

### Caching
- **Config**: `enable_agent_caching` flag
- **Implementation**: Agents can cache results in memory/disk
- **Use case**: Avoid re-indexing same code multiple times

### Parallel Execution
- **Config**: `enable_parallel_agents` flag
- **Future**: Execute multiple agent calls concurrently
- **Consideration**: Need thread-safe agent clients

## Security Considerations

### Input Validation
- All agent inputs validated via TypeScript types
- JSON parsing with error handling
- Path validation to prevent directory traversal

### Process Isolation
- Each agent runs in separate subprocess
- Limited resource access (no direct file system access by default)
- Timeout protection against hanging processes

### Secrets Management
- Never pass secrets via command line
- Use environment variables or config files
- Docker secrets support for production

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock subprocess calls for agent tests
- Fast execution (<1s total)

### Integration Tests
- Test actual agent communication
- Require built TypeScript agents
- Slower but validate end-to-end flow

### Coverage Goals
- Core modules: 90%+
- Agent bridge: 75%+
- CLI: 95%+
- Overall: 70%+

## Future Architecture Improvements

### Planned
1. **Agent Daemon Mode**: Keep agents running to avoid startup overhead
2. **Async Agent Calls**: Use asyncio for concurrent invocations
3. **Event System**: Pub/sub for agent communication
4. **Plugin Registry**: Discover third-party agents automatically
5. **Web UI**: Visual interface for agent management

### Under Consideration
1. **Agent Marketplace**: Share/discover community agents
2. **Remote Agents**: Invoke agents over network
3. **Streaming Responses**: For long-running operations
4. **Agent Composition**: Chain multiple agents together

## References

- [Developer Guide](README.md)
- [Python API Reference](../api/python-api.md)
- [TypeScript API Reference](../api/typescript-api.md)
- [Docker Deployment](../DOCKER.md)
