# pytest-agents Performance Benchmarks

This document tracks performance benchmarks for pytest-agents core operations.

## Benchmark Environment

- **Platform**: Darwin (macOS)
- **Python**: CPython 3.13
- **Architecture**: 64-bit
- **Date**: January 6, 2026
- **Version**: 0.6.1

## Running Benchmarks

```bash
# Run benchmarks
make benchmark

# Save new baseline
make benchmark-save

# Compare against baseline
make benchmark-compare
```

## Current Baseline Performance

### Summary Table

| Test | Mean Time | Median Time | Operations/sec | Relative Speed |
|------|-----------|-------------|----------------|----------------|
| `get_available_agents` | 138 ns | 118 ns | 7.2M ops/sec | 1.0x (baseline) |
| `full_agent_workflow` | 175 ns | 148 ns | 5.7M ops/sec | 1.27x |
| `client_initialization` | 272 ns | 212 ns | 3.7M ops/sec | 1.97x |
| `config_initialization` | 6.9 μs | 6.0 μs | 144.5K ops/sec | 50x |
| `config_from_env` | 29.9 μs | 24.9 μs | 33.5K ops/sec | 216x |
| `bridge_initialization` | 54.2 μs | 27.1 μs | 18.5K ops/sec | 392x |

### Detailed Results

#### AgentBridge Performance

**test_bridge_initialization_performance**
- Min: 22.9 μs
- Max: 1,945.5 μs
- Mean: 54.2 μs
- Median: 27.1 μs
- Std Dev: 119.3 μs
- Operations/sec: 18,451

Initializes the AgentBridge with all 3 agents (PM, Research, Index). This is a one-time operation at startup.

**test_get_available_agents_performance**
- Min: 109.6 ns
- Max: 7,562.9 ns
- Mean: 138.3 ns
- Median: 118.3 ns
- Std Dev: 126.3 ns
- Operations/sec: 7,229,309

Simple dictionary lookup operation - fastest in the suite.

#### AgentClient Performance

**test_client_initialization_performance**
- Min: 196.2 ns
- Max: 366,218.8 ns
- Mean: 272.5 ns
- Median: 211.8 ns
- Std Dev: 1,452.9 ns
- Operations/sec: 3,669,768

Creating individual agent client instances.

#### Configuration Performance

**test_config_initialization_performance**
- Min: 5.5 μs
- Max: 3,005.5 μs
- Mean: 6.9 μs
- Median: 6.0 μs
- Std Dev: 15.4 μs
- Operations/sec: 144,511

Creating pytest-agentsConfig with default values.

**test_config_from_env_performance**
- Min: 22.8 μs
- Max: 1,455.0 μs
- Mean: 29.9 μs
- Median: 24.9 μs
- Std Dev: 27.5 μs
- Operations/sec: 33,491

Creating configuration from environment variables (requires parsing).

#### End-to-End Performance

**test_full_agent_workflow_performance**
- Min: 135.4 ns
- Max: 100,964.1 ns
- Mean: 175.4 ns
- Median: 148.1 ns
- Std Dev: 530.2 ns
- Operations/sec: 5,700,883

Complete agent workflow from request to response.

## Performance Characteristics

### Strengths

1. **Agent Operations**: Core operations are extremely fast (sub-microsecond)
   - Agent lookup: 138 ns
   - Workflow execution: 175 ns
   - Client creation: 272 ns

2. **Initialization**: One-time costs are reasonable
   - Bridge initialization: 54 μs (loads 3 agents)
   - Config from env: 30 μs

3. **Dependency Injection**: Minimal overhead from DI framework
   - Operations remain in nanosecond range

4. **Metrics**: Prometheus metrics add <1ms overhead per operation

### Optimization Opportunities

1. **Bridge Initialization** (54 μs)
   - Could implement lazy loading of agents
   - Only load agents when first requested

2. **Config from Environment** (30 μs)
   - Could cache parsed environment variables
   - Use lazy evaluation for rarely-used config

## Regression Detection

The baseline is saved in `.benchmarks/` (gitignored) and can be used to detect performance regressions:

```bash
# After making changes
make benchmark-compare
```

If mean performance degrades by >10% on any test, investigate the changes.

## Historical Performance

### Version 0.6.1 (January 2026)
- Initial baseline after Prometheus metrics implementation
- Full dependency injection across Python and TypeScript
- 223 tests (135 Python + 88 TypeScript), 60% Python coverage
- All operations <100μs except bridge initialization

## Notes

- Benchmarks are machine-specific and will vary by hardware
- Results use pytest-benchmark with 5+ rounds per test
- Outliers filtered using 1.5 IQR method
- Garbage collection disabled during benchmark runs
- Raw benchmark data stored in `.benchmarks/` (not committed)

## Benchmark Tests Location

Performance tests: `tests/performance/test_agent_performance.py`

Test categories:
- `TestAgentBridgePerformance`: Bridge initialization and operations
- `TestAgentClientPerformance`: Client creation and management
- `TestConfigPerformance`: Configuration loading and parsing
- `TestEndToEndPerformance`: Complete workflows
