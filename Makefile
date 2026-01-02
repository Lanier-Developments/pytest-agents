.PHONY: help install test test-python test-ts lint format clean doctor verify install-plugin reinstall-plugin test-plugin

help:
	@echo "SuperClaude Development Commands"
	@echo "================================="
	@echo "make install          - Install Python package with dev dependencies"
	@echo "make test            - Run all tests (Python + TypeScript)"
	@echo "make test-python     - Run Python tests only"
	@echo "make test-ts         - Run TypeScript tests only"
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
	@uv run python -c "import superclaude; print(f'SuperClaude v{superclaude.__version__}')"
	@echo "Checking pytest plugin..."
	@uv run pytest --version
	@uv run pytest --markers | grep superclaude || true
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
	@uv run pytest --markers | grep -A 5 "superclaude markers"

clean:
	rm -rf build/ dist/ *.egg-info
	rm -rf .pytest_cache .coverage htmlcov
	rm -rf pm/dist pm/node_modules
	rm -rf research/dist research/node_modules
	rm -rf index/dist index/node_modules
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
