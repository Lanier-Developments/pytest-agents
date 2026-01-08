# Multi-stage Dockerfile for pytest-agents
# Stage 1: Build TypeScript agents
FROM node:20-alpine AS ts-builder

WORKDIR /build

# Copy package files for all agents
COPY pm/package*.json ./pm/
COPY research/package*.json ./research/
COPY index/package*.json ./index/

# Install dependencies for each agent
RUN cd pm && npm ci && cd ../research && npm ci && cd ../index && npm ci

# Copy source files and build
COPY pm/ ./pm/
COPY research/ ./research/
COPY index/ ./index/

RUN cd pm && npm run build && \
    cd ../research && npm run build && \
    cd ../index && npm run build

# Stage 2: Python runtime with Node.js
FROM python:3.11-slim

# Install Node.js in Python image
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv for Python package management
RUN pip install --no-cache-dir uv

# Copy Python package files
COPY pyproject.toml uv.lock README.md ./
COPY src/ ./src/

# Install Python dependencies
RUN uv pip install --system -e ".[dev]"

# Copy built TypeScript agents from builder
COPY --from=ts-builder /build/pm/dist ./pm/dist
COPY --from=ts-builder /build/research/dist ./research/dist
COPY --from=ts-builder /build/index/dist ./index/dist

# Copy node_modules for runtime
COPY --from=ts-builder /build/pm/node_modules ./pm/node_modules
COPY --from=ts-builder /build/research/node_modules ./research/node_modules
COPY --from=ts-builder /build/index/node_modules ./index/node_modules

# Copy test suite
COPY tests/ ./tests/

# Copy configuration files
COPY Makefile README.md ./

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTEST_AGENTS_PROJECT_ROOT=/app

# Default command runs verification
CMD ["pytest-agents", "verify"]
