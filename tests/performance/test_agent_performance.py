"""Performance benchmark tests for SuperClaude agents."""

from pathlib import Path

import pytest

from pytest_agents.agent_bridge import AgentBridge, AgentClient
from pytest_agents.config import SuperClaudeConfig


@pytest.fixture
def agent_bridge(tmp_path: Path) -> AgentBridge:
    """Create agent bridge for performance testing."""
    config = SuperClaudeConfig(
        project_root=tmp_path,
        agent_timeout=120,
        agent_pm_enabled=True,
        agent_research_enabled=True,
        agent_index_enabled=True,
    )
    return AgentBridge(config)


@pytest.mark.performance
class TestAgentBridgePerformance:
    """Performance benchmarks for AgentBridge."""

    def test_bridge_initialization_performance(self, benchmark, tmp_path: Path) -> None:
        """Benchmark AgentBridge initialization time."""

        def create_bridge():
            config = SuperClaudeConfig(project_root=tmp_path)
            return AgentBridge(config)

        result = benchmark(create_bridge)
        assert result is not None

    def test_get_available_agents_performance(
        self, benchmark, agent_bridge: AgentBridge
    ) -> None:
        """Benchmark agent discovery performance."""
        result = benchmark(agent_bridge.get_available_agents)
        assert isinstance(result, list)


@pytest.mark.performance
class TestAgentClientPerformance:
    """Performance benchmarks for AgentClient."""

    def test_client_initialization_performance(self, benchmark, tmp_path: Path) -> None:
        """Benchmark AgentClient initialization time."""
        agent_path = tmp_path / "test_agent.js"
        agent_path.write_text('console.log("test");')

        def create_client():
            return AgentClient("test", agent_path, timeout=60)

        result = benchmark(create_client)
        assert result is not None
        assert result.name == "test"


@pytest.mark.performance
class TestConfigPerformance:
    """Performance benchmarks for configuration loading."""

    def test_config_from_env_performance(self, benchmark, monkeypatch) -> None:
        """Benchmark configuration loading from environment."""
        monkeypatch.setenv("SUPERCLAUDE_PROJECT_ROOT", "/tmp/test")

        def load_config():
            return SuperClaudeConfig.from_env()

        result = benchmark(load_config)
        assert result is not None
        assert result.project_root == Path("/tmp/test")

    def test_config_initialization_performance(self, benchmark, tmp_path: Path) -> None:
        """Benchmark direct configuration initialization."""

        def create_config():
            return SuperClaudeConfig(
                project_root=tmp_path,
                agent_timeout=60,
                agent_pm_enabled=True,
                agent_research_enabled=True,
                agent_index_enabled=True,
            )

        result = benchmark(create_config)
        assert result is not None


@pytest.mark.performance
@pytest.mark.slow
class TestEndToEndPerformance:
    """End-to-end performance benchmarks."""

    def test_full_agent_workflow_performance(
        self, benchmark, agent_bridge: AgentBridge
    ) -> None:
        """Benchmark complete agent invocation workflow.

        Note: This is a mock test. Real agent invocation requires
        built TypeScript agents which may not be available in all
        test environments.
        """

        def workflow():
            # Get available agents (discovery)
            agents = agent_bridge.get_available_agents()

            # Simulate agent selection and validation
            if agents:
                agent_name = agents[0]
                return agent_name
            return None

        result = benchmark(workflow)
        # In real environment with built agents, this would return agent name
        # In test environment without agents, it returns None
        assert result is None or isinstance(result, str)
