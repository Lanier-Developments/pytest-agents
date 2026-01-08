"""Prometheus metrics implementation."""

from typing import Dict  # pragma: no cover

from prometheus_client import (  # pragma: no cover
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)


class PrometheusMetrics:  # pragma: no cover
    """Prometheus metrics collector."""

    def __init__(self) -> None:  # pragma: no cover
        """Initialize metrics registry."""
        self.registry = CollectorRegistry()
        self._counters: Dict[str, Counter] = {}
        self._gauges: Dict[str, Gauge] = {}
        self._histograms: Dict[str, Histogram] = {}
        self._metric_configs: Dict[str, list[str]] = {}

        # Pre-configure metrics with their expected labels
        self._configure_metric(
            "pytest_agents_agent_invocations_total", ["agent", "action"]
        )
        self._configure_metric(
            "pytest_agents_agent_invocations_success_total", ["agent", "action"]
        )
        self._configure_metric(
            "pytest_agents_agent_invocations_error_total", ["agent", "action"]
        )
        self._configure_metric(
            "pytest_agents_agent_invocation_duration_seconds", ["agent", "action"]
        )
        self._configure_metric("pytest_agents_bridge_initialized_agents_total", [])

    def _configure_metric(
        self, name: str, label_names: list[str]
    ) -> None:  # pragma: no cover
        """Pre-configure a metric with its label names.

        Args:
            name: Metric name
            label_names: List of label names for this metric
        """
        self._metric_configs[name] = label_names

    def increment_counter(  # pragma: no cover
        self, name: str, labels: Dict[str, str] | None = None
    ) -> None:
        """Increment a counter metric.

        Args:
            name: Metric name
            labels: Optional labels for the metric
        """
        counter = self._get_or_create_counter(name)
        if labels:
            counter.labels(**labels).inc()
        else:
            counter.inc()

    def set_gauge(  # pragma: no cover
        self, name: str, value: float, labels: Dict[str, str] | None = None
    ) -> None:
        """Set a gauge metric value.

        Args:
            name: Metric name
            value: Metric value
            labels: Optional labels for the metric
        """
        gauge = self._get_or_create_gauge(name)
        if labels:
            gauge.labels(**labels).set(value)
        else:
            gauge.set(value)

    def observe_histogram(  # pragma: no cover
        self, name: str, value: float, labels: Dict[str, str] | None = None
    ) -> None:
        """Observe a value in a histogram.

        Args:
            name: Metric name
            value: Value to observe
            labels: Optional labels for the metric
        """
        histogram = self._get_or_create_histogram(name)
        if labels:
            histogram.labels(**labels).observe(value)
        else:
            histogram.observe(value)

    def get_metrics(self) -> str:  # pragma: no cover
        """Get metrics in Prometheus text format.

        Returns:
            Metrics in Prometheus exposition format
        """
        return generate_latest(self.registry).decode("utf-8")

    def _get_or_create_counter(self, name: str) -> Counter:  # pragma: no cover
        """Get or create a counter metric.

        Args:
            name: Metric name

        Returns:
            Counter instance
        """
        if name not in self._counters:
            label_names = self._metric_configs.get(name, [])
            self._counters[name] = Counter(
                name,
                f"Counter metric for {name}",
                labelnames=label_names,
                registry=self.registry,
            )
        return self._counters[name]

    def _get_or_create_gauge(self, name: str) -> Gauge:  # pragma: no cover
        """Get or create a gauge metric.

        Args:
            name: Metric name

        Returns:
            Gauge instance
        """
        if name not in self._gauges:
            label_names = self._metric_configs.get(name, [])
            self._gauges[name] = Gauge(
                name,
                f"Gauge metric for {name}",
                labelnames=label_names,
                registry=self.registry,
            )
        return self._gauges[name]

    def _get_or_create_histogram(self, name: str) -> Histogram:  # pragma: no cover
        """Get or create a histogram metric.

        Args:
            name: Metric name

        Returns:
            Histogram instance
        """
        if name not in self._histograms:
            label_names = self._metric_configs.get(name, [])
            self._histograms[name] = Histogram(
                name,
                f"Histogram metric for {name}",
                labelnames=label_names,
                buckets=(0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10),
                registry=self.registry,
            )
        return self._histograms[name]
