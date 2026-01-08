"""Tests for Prometheus metrics HTTP server."""

from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import PytestAgentsConfig
from pytest_agents.infrastructure.prometheus_metrics import PrometheusMetrics
from pytest_agents.metrics_server import MetricsServer, start_metrics_server


class TestMetricsServer:
    """Test MetricsServer implementation."""

    def test_server_initialization(self):
        """Test that server initializes with correct configuration."""
        metrics = PrometheusMetrics()
        server = MetricsServer(port=9091, host="127.0.0.1", metrics=metrics)

        assert server.port == 9091
        assert server.host == "127.0.0.1"
        assert server.metrics == metrics
        assert not server.is_running()

    def test_server_configuration(self):
        """Test server configuration options."""
        metrics = PrometheusMetrics()

        # Test default configuration
        server = MetricsServer(metrics=metrics)
        assert server.port == 9090  # Default port
        assert server.host == "0.0.0.0"  # Default host

        # Test custom configuration
        server = MetricsServer(port=8080, host="localhost", metrics=metrics)
        assert server.port == 8080
        assert server.host == "localhost"

    def test_server_without_bridge(self):
        """Test server without agent bridge."""
        metrics = PrometheusMetrics()
        server = MetricsServer(metrics=metrics, agent_bridge=None)

        agent_metrics = server.fetch_agent_metrics()
        assert agent_metrics == {}  # No agents available

    def test_get_metrics_text(self):
        """Test getting metrics as text without HTTP server."""
        metrics = PrometheusMetrics()
        metrics.increment_counter("test_counter")

        server = MetricsServer(metrics=metrics)
        metrics_text = server.get_metrics_text()

        assert "test_counter" in metrics_text
        assert "# HELP" in metrics_text
        assert "# TYPE" in metrics_text

    def test_get_metrics_with_custom_metrics(self):
        """Test retrieving custom metrics."""
        metrics = PrometheusMetrics()

        # Add various metric types
        metrics.increment_counter("http_requests_total")
        metrics.set_gauge("active_users", 42)
        metrics.observe_histogram("request_duration_seconds", 0.5)

        server = MetricsServer(metrics=metrics)
        metrics_text = server.get_metrics_text()

        # All metrics should be present
        assert "http_requests_total" in metrics_text
        assert "active_users" in metrics_text
        assert "request_duration_seconds" in metrics_text

    def test_fetch_agent_metrics(self, tmp_path):
        """Test fetching metrics from TypeScript agents."""
        # Create mock PM agent that returns metrics
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text(
            """
            const req = require("fs").readFileSync(0, "utf-8");
            const request = JSON.parse(req);
            if (request.action === "get_metrics") {
                const metrics = "# HELP pm_test_total Test metric\\n" +
                    "# TYPE pm_test_total counter\\npm_test_total 42.0\\n";
                console.log(JSON.stringify({
                    status: "success",
                    data: { metrics: metrics, format: "prometheus" }
                }));
            } else {
                console.log(JSON.stringify({status: "success", data: {}}));
            }
            """
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

        server = MetricsServer(metrics=metrics, agent_bridge=bridge)
        agent_metrics = server.fetch_agent_metrics()

        assert "pm" in agent_metrics
        assert "pm_test_total 42.0" in agent_metrics["pm"]

    def test_server_without_metrics(self):
        """Test that server works without metrics instance."""
        server = MetricsServer(port=9094, host="127.0.0.1", metrics=None)

        # Should still be able to get metrics text (from default registry)
        metrics_text = server.get_metrics_text()
        assert isinstance(metrics_text, str)

    def test_start_metrics_server_function(self):
        """Test convenience function for starting server."""
        metrics = PrometheusMetrics()
        metrics.increment_counter("test_function_counter")

        # Start server in non-blocking mode
        server = start_metrics_server(
            port=9096, host="127.0.0.1", metrics=metrics, block=False
        )

        assert server.is_running()
        assert server.port == 9096
        assert server.host == "127.0.0.1"

        server.stop()
