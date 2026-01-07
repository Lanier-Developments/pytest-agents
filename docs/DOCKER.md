# Docker Deployment Guide

This guide explains how to build and run pytest-agents using Docker containers.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose 2.0+

## Quick Start

### Build and Run

```bash
# Build the Docker image
docker-compose build

# Run verification
docker-compose up superclaude

# Run tests
docker-compose --profile test up superclaude-test

# Start development shell
docker-compose --profile dev run superclaude-dev
```

## Docker Services

### Main Service (superclaude)

The default service that runs the pytest-agents verification command.

```bash
docker-compose up superclaude
```

### Test Service (superclaude-test)

Runs the full test suite with coverage reporting.

```bash
docker-compose --profile test up superclaude-test
```

Coverage reports are saved to the `test-coverage` volume.

### Development Service (superclaude-dev)

Interactive shell for development work.

```bash
docker-compose --profile dev run superclaude-dev
```

## Building the Image

### Standard Build

```bash
docker build -t superclaude:latest .
```

### Multi-Architecture Build

```bash
docker buildx build --platform linux/amd/amd64,linux/arm64 -t superclaude:latest .
```

## Running Containers

### Run Verification

```bash
docker run --rm superclaude:latest superclaude verify
```

### Run Specific Agent

```bash
docker run --rm superclaude:latest superclaude agent pm list_tasks
```

### Run Tests

```bash
docker run --rm superclaude:latest uv run pytest -v
```

### Interactive Shell

```bash
docker run --rm -it superclaude:latest /bin/bash
```

## Environment Variables

Configure pytest-agents using environment variables:

```bash
docker run --rm \
  -e PYTEST_AGENTS_AGENT_PM_ENABLED=true \
  -e PYTEST_AGENTS_AGENT_TIMEOUT=60 \
  -e PYTEST_AGENTS_LOG_LEVEL=DEBUG \
  superclaude:latest superclaude verify
```

Available variables:
- `PYTEST_AGENTS_PROJECT_ROOT` - Project root directory (default: /app)
- `PYTEST_AGENTS_AGENT_PM_ENABLED` - Enable PM agent (default: true)
- `PYTEST_AGENTS_AGENT_RESEARCH_ENABLED` - Enable Research agent (default: true)
- `PYTEST_AGENTS_AGENT_INDEX_ENABLED` - Enable Index agent (default: true)
- `PYTEST_AGENTS_AGENT_TIMEOUT` - Agent timeout in seconds (default: 30)
- `PYTEST_AGENTS_AGENT_RETRY_COUNT` - Agent retry count (default: 3)
- `PYTEST_AGENTS_LOG_LEVEL` - Logging level (default: INFO)
- `PYTEST_AGENTS_ENABLE_AGENT_CACHING` - Enable caching (default: true)
- `PYTEST_AGENTS_ENABLE_PARALLEL_AGENTS` - Enable parallel execution (default: false)

## Volume Mounts

### Development Mode

Mount source code for live updates:

```bash
docker run --rm -it \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/tests:/app/tests \
  superclaude:latest /bin/bash
```

### Agent State Persistence

Persist agent memory and state:

```bash
docker run --rm \
  -v superclaude-data:/app/.agent-memory \
  superclaude:latest superclaude verify
```

## Docker Compose Profiles

### Default Profile

Runs only the main superclaude service:

```bash
docker-compose up
```

### Test Profile

Includes the test runner service:

```bash
docker-compose --profile test up
```

### Dev Profile

Includes the development shell service:

```bash
docker-compose --profile dev up
```

## Multi-Stage Build

The Dockerfile uses multi-stage builds for optimization:

1. **Stage 1 (ts-builder)**: Builds TypeScript agents
2. **Stage 2 (runtime)**: Python runtime with Node.js and built agents

This approach:
- Reduces final image size
- Separates build and runtime dependencies
- Improves build caching

## Security Considerations

- Container runs as root by default; consider adding a non-root user for production
- Mount secrets as read-only volumes, not environment variables
- Use Docker secrets for sensitive configuration in production
- Regularly update base images for security patches

## Troubleshooting

### Build Failures

```bash
# Clean build (no cache)
docker build --no-cache -t superclaude:latest .

# Check build logs
docker-compose build --progress=plain
```

### Runtime Issues

```bash
# View container logs
docker-compose logs superclaude

# Check running containers
docker ps -a

# Inspect container
docker inspect superclaude
```

### Agent Path Issues

If agents can't be found:

```bash
# Verify agent files exist in container
docker run --rm superclaude:latest ls -la /app/pm/dist
docker run --rm superclaude:latest ls -la /app/research/dist
docker run --rm superclaude:latest ls -la /app/index/dist
```

## Production Deployment

### Using Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  superclaude:
    image: superclaude:latest
    restart: always
    environment:
      - PYTEST_AGENTS_LOG_LEVEL=WARNING
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks

Add to Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD superclaude verify || exit 1
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t superclaude:${{ github.sha }} .
      - name: Run tests in container
        run: docker run --rm superclaude:${{ github.sha }} uv run pytest -v
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
