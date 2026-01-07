# pytest-agents Prometheus Metrics

pytest-agents includes comprehensive Prometheus metrics collection across all components, enabling monitoring and observability for your test automation pipeline.

## Architecture

```
┌─────────────────────────────────┐
│   Metrics HTTP Server           │
│   (Port 9090)                   │
│   /metrics endpoint             │
└───────────┬─────────────────────┘
            │
            ├─► Python Layer Metrics
            │   • Agent invocations
            │   • Invocation duration
            │   • Success/error rates
            │   • Bridge initialization
            │
            └─► TypeScript Agent Metrics
                • PM Agent: tasks, milestones
                • Research: documents, citations
                • Index: symbols, searches
```

## Quick Start

### Starting the Metrics Server

```bash
# Start metrics server on default port (9090)
pytest-agents metrics

# Start on custom port
pytest-agents metrics --port 8080

# Start on specific host
pytest-agents metrics --host localhost --port 9091
```

### Configure via Environment Variables

```bash
export PYTEST_AGENTS_METRICS_ENABLED=true
export PYTEST_AGENTS_METRICS_PORT=9090
export PYTEST_AGENTS_METRICS_HOST=0.0.0.0
```

### Scrape with Prometheus

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'pytest-agents'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 15s
```

## Available Metrics

### Python Layer Metrics

#### Agent Bridge Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `pytest_agents_bridge_initialized_agents_total` | Gauge | - | Number of initialized agents |
| `pytest_agents_agent_invocations_total` | Counter | `agent`, `action` | Total agent invocations |
| `pytest_agents_agent_invocations_success_total` | Counter | `agent`, `action` | Successful invocations |
| `pytest_agents_agent_invocations_error_total` | Counter | `agent`, `action` | Failed invocations |
| `pytest_agents_agent_invocation_duration_seconds` | Histogram | `agent`, `action` | Invocation duration |

**Example queries:**

```promql
# Agent invocation rate
rate(pytest_agents_agent_invocations_total[5m])

# Error rate by agent
rate(pytest_agents_agent_invocations_error_total[5m]) / rate(pytest_agents_agent_invocations_total[5m])

# P95 invocation latency
histogram_quantile(0.95, rate(pytest_agents_agent_invocation_duration_seconds_bucket[5m]))
```

### PM Agent Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `pm_agent_requests_total` | Counter | `action` | Total requests to PM agent |
| `pm_agent_requests_success_total` | Counter | `action` | Successful requests |
| `pm_agent_requests_error_total` | Counter | `action` | Failed requests |
| `pm_agent_request_duration_seconds` | Histogram | `action` | Request duration |
| `pm_agent_tasks_total` | Gauge | - | Total tracked tasks |
| `pm_agent_tasks_by_type` | Gauge | `type` | Tasks by type (TODO, FIXME, etc.) |

**Example queries:**

```promql
# Total tasks being tracked
pm_agent_tasks_total

# Task breakdown by type
sum by (type) (pm_agent_tasks_by_type)

# PM agent request rate
rate(pm_agent_requests_total[5m])
```

### Research Agent Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `research_agent_requests_total` | Counter | `action` | Total requests |
| `research_agent_documents_analyzed_total` | Counter | - | Documents analyzed |
| `research_agent_sections_extracted_total` | Counter | - | Sections extracted |
| `research_agent_summaries_generated_total` | Counter | - | Summaries generated |
| `research_agent_sources_added_total` | Counter | `type` | Sources added by type |
| `research_agent_citations_created_total` | Counter | - | Citations created |
| `research_agent_knowledge_nodes_total` | Counter | - | Knowledge graph nodes |

**Example queries:**

```promql
# Document analysis rate
rate(research_agent_documents_analyzed_total[1h])

# Sources by type
sum by (type) (rate(research_agent_sources_added_total[5m]))

# Citations created
increase(research_agent_citations_created_total[1d])
```

### Index Agent Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `index_agent_requests_total` | Counter | `action` | Total requests |
| `index_agent_repositories_indexed_total` | Counter | - | Repositories indexed |
| `index_agent_symbols_total` | Gauge | - | Total indexed symbols |
| `index_agent_symbols_by_type` | Gauge | `type` | Symbols by type |
| `index_agent_files_indexed_total` | Gauge | - | Files in index |
| `index_agent_searches_performed_total` | Counter | - | Searches performed |
| `index_agent_references_found_total` | Counter | - | Reference lookups |

**Example queries:**

```promql
# Index size
index_agent_symbols_total

# Symbol breakdown
sum by (type) (index_agent_symbols_by_type)

# Search rate
rate(index_agent_searches_performed_total[5m])
```

## Programmatic Usage

### Python

```python
from pytest_agents.di.container import ApplicationContainer
from pytest_agents.metrics_server import start_metrics_server

# Setup DI container
container = ApplicationContainer()
metrics = container.metrics()
bridge = container.agent_bridge()

# Start metrics server
server = start_metrics_server(
    port=9090,
    host="0.0.0.0",
    metrics=metrics,
    agent_bridge=bridge,
    block=False  # Non-blocking mode
)

# Do work...

# Get metrics as text
metrics_text = server.get_metrics_text()
print(metrics_text)

# Fetch metrics from agents
agent_metrics = server.fetch_agent_metrics()
for agent, metrics in agent_metrics.items():
    print(f"{agent}: {metrics}")

# Stop server
server.stop()
```

### TypeScript Agents

Each TypeScript agent exposes metrics via the `get_metrics` action:

```typescript
const response = await agent.processRequest({
  action: 'get_metrics',
  params: {}
});

console.log(response.data.metrics);  // Prometheus format
console.log(response.data.format);   // "prometheus"
```

## Grafana Dashboard

Example Grafana dashboard queries:

### Agent Health Panel
```promql
sum(rate(pytest_agents_agent_invocations_success_total[5m])) by (agent)
```

### Error Rate Panel
```promql
sum(rate(pytest_agents_agent_invocations_error_total[5m])) by (agent) /
sum(rate(pytest_agents_agent_invocations_total[5m])) by (agent)
```

### Latency Heatmap
```promql
sum(rate(pytest_agents_agent_invocation_duration_seconds_bucket[5m])) by (le, agent)
```

## Testing Metrics

```bash
# Run metrics tests
uv run pytest tests/unit/test_metrics.py -v
uv run pytest tests/unit/test_agent_bridge_metrics.py -v
uv run pytest tests/unit/test_metrics_server.py -v

# Run full test suite
make test
```

## Docker Deployment

Example docker-compose.yml:

```yaml
version: '3.8'
services:
  pytest-agents:
    build: .
    command: pytest-agents metrics
    ports:
      - "9090:9090"
    environment:
      - PYTEST_AGENTS_METRICS_ENABLED=true
      - PYTEST_AGENTS_METRICS_PORT=9090

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9091:9090"
    depends_on:
      - pytest-agents

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :9090

# Use a different port
pytest-agents metrics --port 9091
```

### Metrics Not Updating
- Ensure agents are being invoked
- Check that metrics server is running: `curl http://localhost:9090/metrics`
- Verify DI container is properly wired

### Agent Metrics Not Appearing
- Ensure TypeScript agents are built: `make install`
- Verify agents respond to `get_metrics` action
- Check agent logs for errors

## Performance Considerations

- Metrics collection adds minimal overhead (<1ms per operation)
- Histogram buckets are optimized for typical request durations (1ms - 10s)
- Metrics registry uses thread-safe operations
- HTTP server runs in a daemon thread

## Best Practices

1. **Use labels wisely**: Don't create high-cardinality label combinations
2. **Monitor error rates**: Set up alerts on error rate thresholds
3. **Track latency**: Use histograms to understand performance distribution
4. **Regular scraping**: Configure Prometheus to scrape every 15-30 seconds
5. **Retention**: Store metrics for at least 30 days for trend analysis

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Dashboard Guide](https://grafana.com/docs/grafana/latest/dashboards/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
