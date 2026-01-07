"""Configuration management for SuperClaude."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional


@dataclass
class SuperClaudeConfig:
    """Configuration for SuperClaude plugin."""

    # Agent configuration
    agent_pm_enabled: bool = True
    agent_research_enabled: bool = True
    agent_index_enabled: bool = True

    # Paths
    project_root: Path = field(default_factory=Path.cwd)
    agent_pm_path: Optional[Path] = None
    agent_research_path: Optional[Path] = None
    agent_index_path: Optional[Path] = None

    # Agent communication
    agent_timeout: int = 30
    agent_retry_count: int = 3

    # Logging
    log_level: str = "INFO"
    log_file: Optional[Path] = None

    # Feature flags
    enable_agent_caching: bool = True
    enable_parallel_agents: bool = False

    # Metrics server configuration
    metrics_enabled: bool = False
    metrics_port: int = 9090
    metrics_host: str = "0.0.0.0"

    def __post_init__(self) -> None:
        """Initialize paths after dataclass creation."""
        if self.agent_pm_path is None:
            self.agent_pm_path = self.project_root / "pm" / "dist" / "index.js"
        if self.agent_research_path is None:
            self.agent_research_path = (
                self.project_root / "research" / "dist" / "index.js"
            )
        if self.agent_index_path is None:
            self.agent_index_path = self.project_root / "index" / "dist" / "index.js"

    @classmethod
    def from_pytest_config(cls, config: Any) -> "SuperClaudeConfig":
        """Create config from pytest config object.

        Args:
            config: Pytest config object

        Returns:
            SuperClaudeConfig: Configuration instance
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

    @classmethod
    def from_env(cls) -> "SuperClaudeConfig":
        """Create config from environment variables.

        Returns:
            SuperClaudeConfig: Configuration instance
        """
        return cls(
            agent_pm_enabled=os.getenv("SUPERCLAUDE_AGENT_PM_ENABLED", "true").lower()
            == "true",
            agent_research_enabled=os.getenv(
                "SUPERCLAUDE_AGENT_RESEARCH_ENABLED", "true"
            ).lower()
            == "true",
            agent_index_enabled=os.getenv(
                "SUPERCLAUDE_AGENT_INDEX_ENABLED", "true"
            ).lower()
            == "true",
            project_root=Path(os.getenv("SUPERCLAUDE_PROJECT_ROOT", os.getcwd())),
            agent_timeout=int(os.getenv("SUPERCLAUDE_AGENT_TIMEOUT", "30")),
            agent_retry_count=int(os.getenv("SUPERCLAUDE_AGENT_RETRY_COUNT", "3")),
            log_level=os.getenv("SUPERCLAUDE_LOG_LEVEL", "INFO"),
            enable_agent_caching=os.getenv(
                "SUPERCLAUDE_ENABLE_AGENT_CACHING", "true"
            ).lower()
            == "true",
            enable_parallel_agents=os.getenv(
                "SUPERCLAUDE_ENABLE_PARALLEL_AGENTS", "false"
            ).lower()
            == "true",
            metrics_enabled=os.getenv("SUPERCLAUDE_METRICS_ENABLED", "false").lower()
            == "true",
            metrics_port=int(os.getenv("SUPERCLAUDE_METRICS_PORT", "9090")),
            metrics_host=os.getenv("SUPERCLAUDE_METRICS_HOST", "0.0.0.0"),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary.

        Returns:
            Dict[str, Any]: Configuration as dictionary
        """
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
