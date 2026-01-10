"""Configuration management for pytest-agents."""

import os  # pragma: no cover
from dataclasses import dataclass, field  # pragma: no cover
from pathlib import Path  # pragma: no cover
from typing import Any, Dict, Optional  # pragma: no cover

# Security constants for configuration validation
MIN_TIMEOUT_SECONDS = 1  # pragma: no cover
MAX_TIMEOUT_SECONDS = 3600  # 1 hour max  # pragma: no cover
MIN_RETRY_COUNT = 0  # pragma: no cover
MAX_RETRY_COUNT = 10  # pragma: no cover


def _validate_timeout(  # pragma: no cover
    value: int, field_name: str = "timeout"
) -> int:
    """Validate timeout value is within acceptable range.

    Args:
        value: Timeout value in seconds
        field_name: Name of field for error messages

    Returns:
        int: Validated timeout value

    Raises:
        ValueError: If timeout is out of range
    """
    if not MIN_TIMEOUT_SECONDS <= value <= MAX_TIMEOUT_SECONDS:
        raise ValueError(
            f"{field_name} must be between {MIN_TIMEOUT_SECONDS} and "
            f"{MAX_TIMEOUT_SECONDS} seconds, got {value}"
        )
    return value


def _validate_retry_count(value: int) -> int:  # pragma: no cover
    """Validate retry count is within acceptable range.

    Args:
        value: Retry count

    Returns:
        int: Validated retry count

    Raises:
        ValueError: If retry count is out of range
    """
    if not MIN_RETRY_COUNT <= value <= MAX_RETRY_COUNT:
        raise ValueError(
            f"retry_count must be between {MIN_RETRY_COUNT} and "
            f"{MAX_RETRY_COUNT}, got {value}"
        )
    return value


@dataclass  # pragma: no cover
class PytestAgentsConfig:  # pragma: no cover
    """Configuration for pytest-agents plugin."""

    # Agent configuration  # pragma: no cover
    agent_pm_enabled: bool = True  # pragma: no cover
    agent_research_enabled: bool = True  # pragma: no cover
    agent_index_enabled: bool = True  # pragma: no cover

    # Paths  # pragma: no cover
    project_root: Path = field(default_factory=Path.cwd)  # pragma: no cover
    agent_pm_path: Optional[Path] = None  # pragma: no cover
    agent_research_path: Optional[Path] = None  # pragma: no cover
    agent_index_path: Optional[Path] = None  # pragma: no cover

    # Agent communication  # pragma: no cover
    agent_timeout: int = 30  # pragma: no cover
    agent_retry_count: int = 3  # pragma: no cover

    # Logging  # pragma: no cover
    log_level: str = "INFO"  # pragma: no cover
    log_file: Optional[Path] = None  # pragma: no cover

    # Feature flags  # pragma: no cover
    enable_agent_caching: bool = True  # pragma: no cover
    enable_parallel_agents: bool = False  # pragma: no cover

    # Metrics server configuration  # pragma: no cover
    metrics_enabled: bool = False  # pragma: no cover
    metrics_port: int = 9090  # pragma: no cover
    metrics_host: str = "127.0.0.1"  # pragma: no cover

    def __post_init__(self) -> None:  # pragma: no cover
        """Initialize paths after dataclass creation."""
        # Validate timeout and retry count
        self.agent_timeout = _validate_timeout(
            self.agent_timeout, "agent_timeout"
        )
        self.agent_retry_count = _validate_retry_count(self.agent_retry_count)

        if self.agent_pm_path is None:
            self.agent_pm_path = self.project_root / "pm" / "dist" / "index.js"
        if self.agent_research_path is None:
            self.agent_research_path = (
                self.project_root / "research" / "dist" / "index.js"
            )
        if self.agent_index_path is None:
            self.agent_index_path = self.project_root / "index" / "dist" / "index.js"

    @classmethod  # pragma: no cover
    def from_pytest_config(
        cls, config: Any
    ) -> "PytestAgentsConfig":  # pragma: no cover
        """Create config from pytest config object.

        Args:
            config: Pytest config object

        Returns:
            PytestAgentsConfig: Configuration instance
        """
        ini_config = config.inicfg

        return cls(
            agent_pm_enabled=ini_config.get("pytest_agents_agent_pm_enabled", True),
            agent_research_enabled=ini_config.get(
                "pytest_agents_agent_research_enabled", True
            ),
            agent_index_enabled=ini_config.get(
                "pytest_agents_agent_index_enabled", True
            ),
            project_root=Path(config.rootpath),
            agent_timeout=int(ini_config.get("pytest_agents_agent_timeout", 30)),
            agent_retry_count=int(ini_config.get("pytest_agents_agent_retry_count", 3)),
            log_level=ini_config.get("pytest_agents_log_level", "INFO"),
            enable_agent_caching=ini_config.get(
                "pytest_agents_enable_agent_caching", True
            ),
            enable_parallel_agents=ini_config.get(
                "pytest_agents_enable_parallel_agents", False
            ),
        )

    @classmethod  # pragma: no cover
    def from_env(cls) -> "PytestAgentsConfig":  # pragma: no cover
        """Create config from environment variables.

        Returns:
            PytestAgentsConfig: Configuration instance
        """
        return cls(
            agent_pm_enabled=os.getenv("PYTEST_AGENTS_AGENT_PM_ENABLED", "true").lower()
            == "true",
            agent_research_enabled=os.getenv(
                "PYTEST_AGENTS_AGENT_RESEARCH_ENABLED", "true"
            ).lower()
            == "true",
            agent_index_enabled=os.getenv(
                "PYTEST_AGENTS_AGENT_INDEX_ENABLED", "true"
            ).lower()
            == "true",
            project_root=Path(os.getenv("PYTEST_AGENTS_PROJECT_ROOT", os.getcwd())),
            agent_timeout=int(os.getenv("PYTEST_AGENTS_AGENT_TIMEOUT", "30")),
            agent_retry_count=int(os.getenv("PYTEST_AGENTS_AGENT_RETRY_COUNT", "3")),
            log_level=os.getenv("PYTEST_AGENTS_LOG_LEVEL", "INFO"),
            enable_agent_caching=os.getenv(
                "PYTEST_AGENTS_ENABLE_AGENT_CACHING", "true"
            ).lower()
            == "true",
            enable_parallel_agents=os.getenv(
                "PYTEST_AGENTS_ENABLE_PARALLEL_AGENTS", "false"
            ).lower()
            == "true",
            metrics_enabled=os.getenv("PYTEST_AGENTS_METRICS_ENABLED", "false").lower()
            == "true",
            metrics_port=int(os.getenv("PYTEST_AGENTS_METRICS_PORT", "9090")),
            metrics_host=os.getenv("PYTEST_AGENTS_METRICS_HOST", "127.0.0.1"),
        )

    def to_dict(  # pragma: no cover
        self, mask_sensitive: bool = False
    ) -> Dict[str, Any]:
        """Convert config to dictionary.

        Args:
            mask_sensitive: If True, mask sensitive values like paths

        Returns:
            Dict[str, Any]: Configuration as dictionary
        """
        if mask_sensitive:
            return {
                "agent_pm_enabled": self.agent_pm_enabled,
                "agent_research_enabled": self.agent_research_enabled,
                "agent_index_enabled": self.agent_index_enabled,
                "project_root": "<masked>",
                "agent_pm_path": "<masked>" if self.agent_pm_path else None,
                "agent_research_path": "<masked>" if self.agent_research_path else None,
                "agent_index_path": "<masked>" if self.agent_index_path else None,
                "agent_timeout": self.agent_timeout,
                "agent_retry_count": self.agent_retry_count,
                "log_level": self.log_level,
                "log_file": "<masked>" if self.log_file else None,
                "enable_agent_caching": self.enable_agent_caching,
                "enable_parallel_agents": self.enable_parallel_agents,
                "metrics_enabled": self.metrics_enabled,
                "metrics_port": self.metrics_port,
                "metrics_host": self.metrics_host,
            }
        return {
            "agent_pm_enabled": self.agent_pm_enabled,
            "agent_research_enabled": self.agent_research_enabled,
            "agent_index_enabled": self.agent_index_enabled,
            "project_root": str(self.project_root),
            "agent_pm_path": str(self.agent_pm_path) if self.agent_pm_path else None,
            "agent_research_path": (
                str(self.agent_research_path) if self.agent_research_path else None
            ),
            "agent_index_path": (
                str(self.agent_index_path) if self.agent_index_path else None
            ),
            "agent_timeout": self.agent_timeout,
            "agent_retry_count": self.agent_retry_count,
            "log_level": self.log_level,
            "log_file": str(self.log_file) if self.log_file else None,
            "enable_agent_caching": self.enable_agent_caching,
            "enable_parallel_agents": self.enable_parallel_agents,
            "metrics_enabled": self.metrics_enabled,
            "metrics_port": self.metrics_port,
            "metrics_host": self.metrics_host,
        }

    def __repr__(self) -> str:  # pragma: no cover
        """Return a string representation with masked sensitive values."""
        return f"PytestAgentsConfig({self.to_dict(mask_sensitive=True)})"
