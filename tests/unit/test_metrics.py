"""Tests for Prometheus metrics collection."""

from pytest_agents.infrastructure.prometheus_metrics import PrometheusMetrics


class TestPrometheusMetrics:
    """Test PrometheusMetrics implementation."""

    def test_counter_increment(self):
        """Test incrementing a counter."""
        metrics = PrometheusMetrics()

        metrics.increment_counter("test_counter_total")
        metrics.increment_counter("test_counter_total")

        output = metrics.get_metrics()

        assert "test_counter_total" in output
        assert "test_counter_total 2.0" in output

    def test_counter_with_labels(self):
        """Test counter with labels."""
        metrics = PrometheusMetrics()

        # Pre-configure the metric
        metrics._configure_metric("test_labeled_counter", ["status"])

        metrics.increment_counter("test_labeled_counter", {"status": "success"})
        metrics.increment_counter("test_labeled_counter", {"status": "success"})
        metrics.increment_counter("test_labeled_counter", {"status": "error"})

        output = metrics.get_metrics()

        assert "test_labeled_counter" in output
        assert 'status="success"' in output
        assert 'status="error"' in output

    def test_gauge_set(self):
        """Test setting a gauge value."""
        metrics = PrometheusMetrics()

        metrics.set_gauge("test_gauge", 42.5)

        output = metrics.get_metrics()

        assert "test_gauge" in output
        assert "42.5" in output

    def test_gauge_with_labels(self):
        """Test gauge with labels."""
        metrics = PrometheusMetrics()

        # Pre-configure the metric
        metrics._configure_metric("test_labeled_gauge", ["type"])

        metrics.set_gauge("test_labeled_gauge", 10, {"type": "foo"})
        metrics.set_gauge("test_labeled_gauge", 20, {"type": "bar"})

        output = metrics.get_metrics()

        assert "test_labeled_gauge" in output
        assert 'type="foo"' in output
        assert 'type="bar"' in output

    def test_histogram_observe(self):
        """Test observing histogram values."""
        metrics = PrometheusMetrics()

        metrics.observe_histogram("test_histogram_seconds", 0.5)
        metrics.observe_histogram("test_histogram_seconds", 1.5)
        metrics.observe_histogram("test_histogram_seconds", 2.5)

        output = metrics.get_metrics()

        assert "test_histogram_seconds" in output
        # Should have count and sum
        assert "test_histogram_seconds_count" in output
        assert "test_histogram_seconds_sum" in output

    def test_histogram_with_labels(self):
        """Test histogram with labels."""
        metrics = PrometheusMetrics()

        # Pre-configure the metric
        metrics._configure_metric("test_labeled_histogram", ["operation"])

        metrics.observe_histogram("test_labeled_histogram", 0.1, {"operation": "read"})
        metrics.observe_histogram("test_labeled_histogram", 0.2, {"operation": "write"})

        output = metrics.get_metrics()

        assert "test_labeled_histogram" in output
        assert 'operation="read"' in output
        assert 'operation="write"' in output

    def test_preconfigured_metrics(self):
        """Test that pytest-agents metrics are pre-configured."""
        metrics = PrometheusMetrics()

        # These should be pre-configured
        assert "pytest_agents_agent_invocations_total" in metrics._metric_configs
        assert (
            "pytest_agents_agent_invocations_success_total" in metrics._metric_configs
        )
        assert "pytest_agents_agent_invocations_error_total" in metrics._metric_configs
        assert (
            "pytest_agents_agent_invocation_duration_seconds" in metrics._metric_configs
        )
        assert (
            "pytest_agents_bridge_initialized_agents_total" in metrics._metric_configs
        )

        # Verify label configurations
        assert metrics._metric_configs["pytest_agents_agent_invocations_total"] == [
            "agent",
            "action",
        ]
        assert (
            metrics._metric_configs["pytest_agents_bridge_initialized_agents_total"]
            == []
        )

    def test_multiple_metrics(self):
        """Test tracking multiple different metrics."""
        metrics = PrometheusMetrics()

        metrics._configure_metric("requests_total", ["method"])
        metrics._configure_metric("active_connections", [])
        metrics._configure_metric("request_duration_seconds", ["endpoint"])

        metrics.increment_counter("requests_total", {"method": "GET"})
        metrics.set_gauge("active_connections", 5)
        metrics.observe_histogram(
            "request_duration_seconds", 0.25, {"endpoint": "/api"}
        )

        output = metrics.get_metrics()

        assert "requests_total" in output
        assert "active_connections" in output
        assert "request_duration_seconds" in output

    def test_get_metrics_returns_prometheus_format(self):
        """Test that get_metrics returns valid Prometheus format."""
        metrics = PrometheusMetrics()

        metrics.increment_counter("test_counter")

        output = metrics.get_metrics()

        # Should be string
        assert isinstance(output, str)

        # Should contain TYPE and HELP comments
        assert "# HELP" in output
        assert "# TYPE" in output

        # Should contain metric name and value
        assert "test_counter" in output
