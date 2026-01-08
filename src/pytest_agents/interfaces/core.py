"""Core protocol interfaces for dependency injection."""

from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, List, Protocol

if TYPE_CHECKING:
    from pytest_agents.config import PytestAgentsConfig


class IProcessRunner(Protocol):
    """Process execution abstraction."""

    def run(self, cmd: List[str], input: str = "", timeout: int = 30) -> Dict[str, Any]:
        """Execute a process and return results.

        Args:
            cmd: Command and arguments to execute
            input: Input to send to stdin
            timeout: Timeout in seconds

        Returns:
            Dict with returncode, stdout, stderr
        """
        ...


class IFileSystem(Protocol):
    """File system operations abstraction."""

    def read_file(self, path: Path) -> str:
        """Read file contents.

        Args:
            path: Path to file

        Returns:
            File contents as string
        """
        ...

    def write_file(self, path: Path, content: str) -> None:
        """Write content to file.

        Args:
            path: Path to file
            content: Content to write
        """
        ...

    def exists(self, path: Path) -> bool:
        """Check if path exists.

        Args:
            path: Path to check

        Returns:
            True if path exists
        """
        ...


class IAgentClient(Protocol):
    """Agent communication abstraction."""

    def invoke(
        self, action: str, params: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:
        """Invoke agent with action and parameters.

        Args:
            action: Action to perform
            params: Optional parameters

        Returns:
            Agent response dictionary
        """
        ...


class IConfigFactory(Protocol):
    """Configuration creation abstraction."""

    def create(self) -> "PytestAgentsConfig":
        """Create configuration instance.

        Returns:
            PytestAgentsConfig instance
        """
        ...


class IMetrics(Protocol):
    """Metrics collection abstraction."""

    def increment_counter(
        self, name: str, labels: Dict[str, str] | None = None
    ) -> None:
        """Increment a counter metric.

        Args:
            name: Metric name
            labels: Optional labels for the metric
        """
        ...

    def set_gauge(
        self, name: str, value: float, labels: Dict[str, str] | None = None
    ) -> None:
        """Set a gauge metric value.

        Args:
            name: Metric name
            value: Metric value
            labels: Optional labels for the metric
        """
        ...

    def observe_histogram(
        self, name: str, value: float, labels: Dict[str, str] | None = None
    ) -> None:
        """Observe a value in a histogram.

        Args:
            name: Metric name
            value: Value to observe
            labels: Optional labels for the metric
        """
        ...

    def get_metrics(self) -> str:
        """Get metrics in Prometheus text format.

        Returns:
            Metrics in Prometheus exposition format
        """
        ...
