"""Tests for AgentBridge metrics collection."""

from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import PytestAgentsConfig
from pytest_agents.infrastructure.prometheus_metrics import PrometheusMetrics


class TestAgentBridgeMetrics:
    """Test metrics collection in AgentBridge."""

    def test_bridge_tracks_initialized_agents(self, tmp_path):
        """Test that bridge tracks count of initialized agents."""
        # Create mock agent files
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text("console.log('mock')")

        research_agent = tmp_path / "research" / "dist" / "index.js"
        research_agent.parent.mkdir(parents=True)
        research_agent.write_text("console.log('mock')")

        config = PytestAgentsConfig(
            agent_pm_enabled=True,
            agent_pm_path=pm_agent,
            agent_research_enabled=True,
            agent_research_path=research_agent,
            agent_index_enabled=False,
            agent_timeout=30,
        )

        metrics = PrometheusMetrics()
        # Initialize bridge to populate metrics
        _ = AgentBridge(config=config, metrics=metrics)

        output = metrics.get_metrics()

        assert "pytest_agents_bridge_initialized_agents_total" in output
        assert "pytest_agents_bridge_initialized_agents_total 2.0" in output

    def test_bridge_tracks_agent_invocations(self, tmp_path):
        """Test that bridge tracks agent invocations."""
        # Create mock agent file
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text(
            'const req = require("fs").readFileSync(0, "utf-8"); '
            'console.log(JSON.stringify({status: "success", data: {message: "pong"}}));'
        )

        config = PytestAgentsConfig(
            agent_pm_enabled=True,
            agent_pm_path=pm_agent,
            agent_research_enabled=False,
            agent_index_enabled=False,
            agent_timeout=30,
        )

        metrics = PrometheusMetrics()
        bridge = AgentBridge(config=config, metrics=metrics)

        # Invoke agent
        response = bridge.invoke_agent("pm", "ping", {})

        assert response["status"] == "success"

        output = metrics.get_metrics()

        # Check invocation metrics
        assert "pytest_agents_agent_invocations_total" in output
        assert 'agent="pm"' in output
        assert 'action="ping"' in output

        # Check success metrics
        assert "pytest_agents_agent_invocations_success_total" in output

        # Check duration metrics
        assert "pytest_agents_agent_invocation_duration_seconds" in output

    def test_bridge_tracks_error_invocations(self, tmp_path):
        """Test that bridge tracks failed agent invocations."""
        # Create mock agent that returns error
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text(
            'const req = require("fs").readFileSync(0, "utf-8"); '
            'console.log(JSON.stringify({status: "error", data: {error: "failed"}}));'
        )

        config = PytestAgentsConfig(
            agent_pm_enabled=True,
            agent_pm_path=pm_agent,
            agent_research_enabled=False,
            agent_index_enabled=False,
            agent_timeout=30,
        )

        metrics = PrometheusMetrics()
        bridge = AgentBridge(config=config, metrics=metrics)

        # Invoke agent
        response = bridge.invoke_agent("pm", "test_action", {})

        assert response["status"] == "error"

        output = metrics.get_metrics()

        # Check error metrics
        assert "pytest_agents_agent_invocations_error_total" in output
        assert 'agent="pm"' in output
        assert 'action="test_action"' in output

    def test_bridge_tracks_multiple_agents(self, tmp_path):
        """Test tracking metrics for multiple different agents."""
        # Create mock agent files
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text(
            'const req = require("fs").readFileSync(0, "utf-8"); '
            'console.log(JSON.stringify({status: "success", data: {}}));'
        )

        research_agent = tmp_path / "research" / "dist" / "index.js"
        research_agent.parent.mkdir(parents=True)
        research_agent.write_text(
            'const req = require("fs").readFileSync(0, "utf-8"); '
            'console.log(JSON.stringify({status: "success", data: {}}));'
        )

        config = PytestAgentsConfig(
            agent_pm_enabled=True,
            agent_pm_path=pm_agent,
            agent_research_enabled=True,
            agent_research_path=research_agent,
            agent_index_enabled=False,
            agent_timeout=30,
        )

        metrics = PrometheusMetrics()
        bridge = AgentBridge(config=config, metrics=metrics)

        # Invoke both agents
        bridge.invoke_agent("pm", "ping", {})
        bridge.invoke_agent("research", "analyze", {})

        output = metrics.get_metrics()

        # Should have metrics for both agents
        assert 'agent="pm"' in output
        assert 'agent="research"' in output
        assert 'action="ping"' in output
        assert 'action="analyze"' in output

    def test_bridge_without_metrics(self, tmp_path):
        """Test that bridge works without metrics (backwards compatibility)."""
        # Create mock agent file
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text(
            'const req = require("fs").readFileSync(0, "utf-8"); '
            'console.log(JSON.stringify({status: "success", data: {message: "pong"}}));'
        )

        config = PytestAgentsConfig(
            agent_pm_enabled=True,
            agent_pm_path=pm_agent,
            agent_research_enabled=False,
            agent_index_enabled=False,
            agent_timeout=30,
        )

        # Create bridge without metrics
        bridge = AgentBridge(config=config, metrics=None)

        # Should still work
        response = bridge.invoke_agent("pm", "ping", {})
        assert response["status"] == "success"
