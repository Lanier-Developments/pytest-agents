.PHONY: help install test test-python test-ts lint format clean doctor verify install-plugin reinstall-plugin test-plugin benchmark benchmark-compare benchmark-save

help:
	@echo "SuperClaude Development Commands"
	@echo "================================="
	@echo "make install          - Install Python package with dev dependencies"
	@echo "make test            - Run all tests (Python + TypeScript)"
	@echo "make test-python     - Run Python tests only"
	@echo "make test-ts         - Run TypeScript tests only"
	@echo "make benchmark       - Run performance benchmarks"
	@echo "make benchmark-compare - Compare with saved benchmarks"
	@echo "make benchmark-save  - Run and save benchmark results"
	@echo "make lint            - Run linting (Ruff + ESLint)"
	@echo "make format          - Format code (Ruff + Prettier)"
	@echo "make doctor          - Check plugin health"
	@echo "make verify          - Verify installation"
	@echo "make install-plugin  - Install plugin to ~/.claude/plugins"
	@echo "make reinstall-plugin - Reinstall plugin"
	@echo "make test-plugin     - Test plugin detection"
	@echo "make clean           - Clean build artifacts"

install:
	uv pip install -e ".[dev]"
	@if [ -d "pm" ]; then cd pm && npm install; fi
	@if [ -d "research" ]; then cd research && npm install; fi
	@if [ -d "index" ]; then cd index && npm install; fi

test: test-python test-ts

test-python:
	uv run pytest

test-ts:
	@if [ -d "pm" ]; then cd pm && npm test; fi
	@if [ -d "research" ]; then cd research && npm test; fi
	@if [ -d "index" ]; then cd index && npm test; fi

lint:
	uv run ruff check src/ tests/
	@if [ -d "pm" ]; then cd pm && npm run lint; fi
	@if [ -d "research" ]; then cd research && npm run lint; fi
	@if [ -d "index" ]; then cd index && npm run lint; fi

format:
	uv run ruff format src/ tests/
	@if [ -d "pm" ]; then cd pm && npm run format; fi
	@if [ -d "research" ]; then cd research && npm run format; fi
	@if [ -d "index" ]; then cd index && npm run format; fi

doctor: verify

verify:
	@echo "Checking Python installation..."
	@uv run python -c "import pytest_agents; print(f'pytest-agents v{pytest_agents.__version__}')"
	@echo "Checking pytest plugin..."
	@uv run pytest --version
	@uv run pytest --markers | grep pytest_agents || true
	@echo "Checking TypeScript builds..."
	@if [ -d "pm" ]; then cd pm && npm run build; fi
	@if [ -d "research" ]; then cd research && npm run build; fi
	@if [ -d "index" ]; then cd index && npm run build; fi
	@echo "All checks passed!"

install-plugin:
	@mkdir -p ~/.claude/plugins/pm-agent
	@if [ -d "pm/dist" ]; then cp -r pm/dist/* ~/.claude/plugins/pm-agent/; fi
	@echo "Plugin installed to ~/.claude/plugins/pm-agent"

reinstall-plugin: install-plugin

test-plugin:
	@echo "Testing plugin detection..."
	@uv run pytest --markers | grep -A 5 "pytest-agents markers"

benchmark:
	@echo "Running performance benchmarks..."
	pytest tests/performance/ \
		-m performance \
		--benchmark-only \
		--benchmark-columns=min,max,mean,stddev,median,ops \
		--benchmark-sort=name

benchmark-compare:
	@echo "Running benchmarks and comparing with baseline..."
	pytest tests/performance/ \
		-m performance \
		--benchmark-only \
		--benchmark-compare=.benchmarks/baseline.json \
		--benchmark-compare-fail=mean:10% \
		--benchmark-columns=min,max,mean,stddev,median,ops

benchmark-save:
	@echo "Running benchmarks and saving as baseline..."
	@mkdir -p .benchmarks
	pytest tests/performance/ \
		-m performance \
		--benchmark-only \
		--benchmark-save=baseline \
		--benchmark-save-data \
		--benchmark-columns=min,max,mean,stddev,median,ops
	@echo "Baseline saved to .benchmarks/baseline.json"

clean:
	rm -rf build/ dist/ *.egg-info
	rm -rf .pytest_cache .coverage htmlcov .benchmarks
	rm -rf pm/dist pm/node_modules
	rm -rf research/dist research/node_modules
	rm -rf index/dist index/node_modules
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
