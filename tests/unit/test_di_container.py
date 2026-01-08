"""Unit tests for DI container."""

import pytest

from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import PytestAgentsConfig
from pytest_agents.di.container import ApplicationContainer
from pytest_agents.infrastructure.env_config_factory import EnvConfigFactory
from pytest_agents.infrastructure.prometheus_metrics import PrometheusMetrics
from pytest_agents.infrastructure.subprocess_runner import SubprocessRunner


@pytest.mark.unit
class TestApplicationContainer:
    """Test cases for ApplicationContainer."""

    def test_container_initialization(self) -> None:
        """Test container can be instantiated."""
        container = ApplicationContainer()
        assert container is not None

    def test_container_provides_process_runner(self) -> None:
        """Test container provides SubprocessRunner singleton."""
        container = ApplicationContainer()

        runner1 = container.process_runner()
        runner2 = container.process_runner()

        assert isinstance(runner1, SubprocessRunner)
        assert runner1 is runner2  # Singleton

    def test_container_provides_config_factory(self) -> None:
        """Test container provides EnvConfigFactory singleton."""
        container = ApplicationContainer()

        factory1 = container.config_factory()
        factory2 = container.config_factory()

        assert isinstance(factory1, EnvConfigFactory)
        assert factory1 is factory2  # Singleton

    def test_container_provides_metrics(self) -> None:
        """Test container provides PrometheusMetrics singleton."""
        container = ApplicationContainer()

        metrics1 = container.metrics()
        metrics2 = container.metrics()

        assert isinstance(metrics1, PrometheusMetrics)
        assert metrics1 is metrics2  # Singleton

    def test_container_provides_pytest_agents_config(self) -> None:
        """Test container provides PytestAgentsConfig singleton."""
        container = ApplicationContainer()

        config1 = container.pytest_agents_config()
        config2 = container.pytest_agents_config()

        assert isinstance(config1, PytestAgentsConfig)
        assert config1 is config2  # Singleton

    def test_container_provides_agent_bridge(self) -> None:
        """Test container provides AgentBridge singleton."""
        container = ApplicationContainer()

        bridge1 = container.agent_bridge()
        bridge2 = container.agent_bridge()

        assert isinstance(bridge1, AgentBridge)
        assert bridge1 is bridge2  # Singleton

    def test_container_wiring(self) -> None:
        """Test container can be wired to modules."""
        container = ApplicationContainer()

        # Should not raise
        container.wire(modules=[__name__])
        container.unwire()

    def test_container_reset(self) -> None:
        """Test container can be reset."""
        container = ApplicationContainer()

        bridge1 = container.agent_bridge()
        container.reset_singletons()
        bridge2 = container.agent_bridge()

        # After reset, should get new instances
        assert bridge1 is not bridge2
