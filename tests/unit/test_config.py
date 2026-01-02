"""Unit tests for configuration management."""

import os
from pathlib import Path

import pytest

from superclaude.config import SuperClaudeConfig


@pytest.mark.unit
class TestSuperClaudeConfig:
    """Test cases for SuperClaudeConfig."""

    def test_default_initialization(self) -> None:
        """Test config with default values."""
        config = SuperClaudeConfig()
        assert config.agent_pm_enabled is True
        assert config.agent_research_enabled is True
        assert config.agent_index_enabled is True
        assert config.agent_timeout == 30
        assert config.agent_retry_count == 3
        assert config.log_level == "INFO"

    def test_custom_initialization(self) -> None:
        """Test config with custom values."""
        config = SuperClaudeConfig(
            agent_pm_enabled=False,
            agent_timeout=60,
            log_level="DEBUG",
        )
        assert config.agent_pm_enabled is False
        assert config.agent_timeout == 60
        assert config.log_level == "DEBUG"

    def test_post_init_sets_agent_paths(self, temp_project_dir: Path) -> None:
        """Test that __post_init__ sets agent paths."""
        config = SuperClaudeConfig(project_root=temp_project_dir)
        assert config.agent_pm_path == temp_project_dir / "pm" / "dist" / "index.js"
        assert (
            config.agent_research_path
            == temp_project_dir / "research" / "dist" / "index.js"
        )
        assert (
            config.agent_index_path == temp_project_dir / "index" / "dist" / "index.js"
        )

    def test_from_pytest_config(self, mock_pytest_config) -> None:
        """Test creating config from pytest config."""
        config = SuperClaudeConfig.from_pytest_config(mock_pytest_config)
        assert isinstance(config, SuperClaudeConfig)
        assert config.project_root == Path(mock_pytest_config.rootpath)

    def test_from_env(self, monkeypatch) -> None:
        """Test creating config from environment variables."""
        monkeypatch.setenv("SUPERCLAUDE_AGENT_PM_ENABLED", "false")
        monkeypatch.setenv("SUPERCLAUDE_AGENT_TIMEOUT", "45")
        monkeypatch.setenv("SUPERCLAUDE_LOG_LEVEL", "WARNING")

        config = SuperClaudeConfig.from_env()
        assert config.agent_pm_enabled is False
        assert config.agent_timeout == 45
        assert config.log_level == "WARNING"

    def test_to_dict(self) -> None:
        """Test converting config to dictionary."""
        config = SuperClaudeConfig()
        config_dict = config.to_dict()

        assert isinstance(config_dict, dict)
        assert "agent_pm_enabled" in config_dict
        assert "agent_timeout" in config_dict
        assert "log_level" in config_dict
        assert config_dict["agent_pm_enabled"] is True
        assert config_dict["agent_timeout"] == 30

    def test_agent_paths_can_be_customized(self, temp_project_dir: Path) -> None:
        """Test that agent paths can be set explicitly."""
        custom_pm_path = temp_project_dir / "custom" / "pm.js"
        config = SuperClaudeConfig(
            project_root=temp_project_dir, agent_pm_path=custom_pm_path
        )
        assert config.agent_pm_path == custom_pm_path
