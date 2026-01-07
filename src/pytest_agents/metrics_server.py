"""HTTP server for exposing Prometheus metrics."""

import threading
import time
from typing import Optional

from prometheus_client import REGISTRY, generate_latest, start_http_server

from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.infrastructure.prometheus_metrics import PrometheusMetrics
from pytest_agents.utils.logging import setup_logger

logger = setup_logger(__name__)


class MetricsServer:
    """HTTP server for exposing Prometheus metrics."""

    def __init__(
        self,
        port: int = 9090,
        host: str = "0.0.0.0",
        metrics: Optional[PrometheusMetrics] = None,
        agent_bridge: Optional[AgentBridge] = None,
    ) -> None:
        """Initialize metrics server.

        Args:
            port: Port to listen on (default: 9090)
            host: Host to bind to (default: 0.0.0.0)
            metrics: Metrics collector instance
            agent_bridge: Optional agent bridge to fetch agent metrics
        """
        self.port = port
        self.host = host
        self.metrics = metrics
        self.agent_bridge = agent_bridge
        self._server_thread: Optional[threading.Thread] = None
        self._running = False

    def start(self) -> None:
        """Start the metrics HTTP server.

        The server will expose metrics at http://{host}:{port}/metrics
        """
        if self._running:
            logger.warning("Metrics server is already running")
            return

        logger.info(f"Starting metrics server on {self.host}:{self.port}")

        try:
            # Start the Prometheus HTTP server
            # This runs in a daemon thread automatically
            start_http_server(
                self.port,
                addr=self.host,
                registry=self.metrics.registry if self.metrics else REGISTRY,
            )
            self._running = True

            logger.info(
                f"Metrics server started successfully at http://{self.host}:{self.port}/metrics"
            )
        except OSError as e:
            logger.error(f"Failed to start metrics server: {e}")
            raise

    def stop(self) -> None:
        """Stop the metrics HTTP server.

        Note: prometheus_client's start_http_server runs in a daemon thread
        which will automatically stop when the main program exits.
        """
        if not self._running:
            logger.warning("Metrics server is not running")
            return

        self._running = False
        logger.info("Metrics server stopped")

    def is_running(self) -> bool:
        """Check if the server is running.

        Returns:
            True if server is running
        """
        return self._running

    def get_metrics_text(self) -> str:
        """Get current metrics in Prometheus text format.

        Returns:
            Metrics in Prometheus exposition format
        """
        if self.metrics:
            return self.metrics.get_metrics()
        else:
            # Use default registry
            return generate_latest(REGISTRY).decode("utf-8")

    def fetch_agent_metrics(self) -> dict[str, str]:
        """Fetch metrics from all TypeScript agents.

        Returns:
            Dictionary mapping agent name to metrics text
        """
        if not self.agent_bridge:
            return {}

        agent_metrics = {}
        for agent_name in self.agent_bridge.get_available_agents():
            try:
                response = self.agent_bridge.invoke_agent(agent_name, "get_metrics", {})
                if response.get("status") == "success" and "data" in response:
                    metrics_text = response["data"].get("metrics", "")
                    agent_metrics[agent_name] = metrics_text
                    logger.debug(f"Fetched metrics from {agent_name} agent")
            except Exception as e:
                logger.warning(f"Failed to fetch metrics from {agent_name}: {e}")

        return agent_metrics


def start_metrics_server(
    port: int = 9090,
    host: str = "0.0.0.0",
    metrics: Optional[PrometheusMetrics] = None,
    agent_bridge: Optional[AgentBridge] = None,
    block: bool = True,
) -> MetricsServer:
    """Start a metrics server and optionally block.

    Args:
        port: Port to listen on
        host: Host to bind to
        metrics: Metrics collector instance
        agent_bridge: Optional agent bridge
        block: If True, block forever; if False, return server instance

    Returns:
        MetricsServer instance
    """
    server = MetricsServer(
        port=port, host=host, metrics=metrics, agent_bridge=agent_bridge
    )
    server.start()

    if block:
        logger.info("Metrics server running. Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down metrics server...")
            server.stop()

    return server
