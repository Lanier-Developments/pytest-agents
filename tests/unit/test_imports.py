"""Test that all modules can be imported successfully."""

import pytest


@pytest.mark.unit
class TestModuleImports:
    """Test all modules import without errors."""

    def test_import_main_package(self) -> None:
        """Test main package imports."""
        import pytest_agents

        assert pytest_agents.__version__ is not None

    def test_import_config(self) -> None:
        """Test config module imports."""
        from pytest_agents import config

        assert hasattr(config, "PytestAgentsConfig")

    def test_import_agent_bridge(self) -> None:
        """Test agent_bridge module imports."""
        from pytest_agents import agent_bridge

        assert hasattr(agent_bridge, "AgentBridge")
        assert hasattr(agent_bridge, "AgentClient")

    def test_import_cli(self) -> None:
        """Test CLI module imports."""
        from pytest_agents import cli

        assert hasattr(cli, "main")

    def test_import_hooks(self) -> None:
        """Test hooks module imports."""
        from pytest_agents import hooks

        assert hasattr(hooks, "pytest_configure")

    def test_import_fixtures(self) -> None:
        """Test fixtures module imports."""
        from pytest_agents import fixtures

        assert hasattr(fixtures, "pytest_agents_config")

    def test_import_markers(self) -> None:
        """Test markers module imports."""
        from pytest_agents import markers

        assert hasattr(markers, "MarkerRegistry")
        assert hasattr(markers, "MARKERS")

    def test_import_plugin(self) -> None:
        """Test plugin module imports."""
        from pytest_agents import plugin

        assert hasattr(plugin, "PytestAgentsPlugin")
        assert hasattr(plugin, "pytest_addoption")

    def test_import_di_container(self) -> None:
        """Test DI container imports."""
        from pytest_agents.di import container

        assert hasattr(container, "ApplicationContainer")

    def test_import_infrastructure_modules(self) -> None:
        """Test infrastructure module imports."""
        from pytest_agents.infrastructure import (
            env_config_factory,
            prometheus_metrics,
            subprocess_runner,
        )

        assert hasattr(env_config_factory, "EnvConfigFactory")
        assert hasattr(prometheus_metrics, "PrometheusMetrics")
        assert hasattr(subprocess_runner, "SubprocessRunner")

    def test_import_utils_modules(self) -> None:
        """Test utils module imports."""
        from pytest_agents.utils import logging, validation

        assert hasattr(logging, "setup_logger")
        assert hasattr(validation, "validate_agent_response")

    def test_import_metrics_server(self) -> None:
        """Test metrics server imports."""
        from pytest_agents import metrics_server

        assert hasattr(metrics_server, "start_metrics_server")
