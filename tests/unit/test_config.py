"""Unit tests for configuration management."""

from pathlib import Path

import pytest

from pytest_agents.config import PytestAgentsConfig


@pytest.mark.unit
class TestPytestAgentsConfig:
    """Test cases for PytestAgentsConfig."""

    def test_default_initialization(self) -> None:
        """Test config with default values."""
        config = PytestAgentsConfig()
        assert config.agent_pm_enabled is True
        assert config.agent_research_enabled is True
        assert config.agent_index_enabled is True
        assert config.agent_timeout == 30
        assert config.agent_retry_count == 3
        assert config.log_level == "INFO"

    def test_custom_initialization(self) -> None:
        """Test config with custom values."""
        config = PytestAgentsConfig(
            agent_pm_enabled=False,
            agent_timeout=60,
            log_level="DEBUG",
        )
        assert config.agent_pm_enabled is False
        assert config.agent_timeout == 60
        assert config.log_level == "DEBUG"

    def test_post_init_sets_agent_paths(self, temp_project_dir: Path) -> None:
        """Test that __post_init__ sets agent paths."""
        config = PytestAgentsConfig(project_root=temp_project_dir)
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
        config = PytestAgentsConfig.from_pytest_config(mock_pytest_config)
        assert isinstance(config, PytestAgentsConfig)
        assert config.project_root == Path(mock_pytest_config.rootpath)

    def test_from_env(self, monkeypatch) -> None:
        """Test creating config from environment variables."""
        monkeypatch.setenv("SUPERCLAUDE_AGENT_PM_ENABLED", "false")
        monkeypatch.setenv("SUPERCLAUDE_AGENT_TIMEOUT", "45")
        monkeypatch.setenv("SUPERCLAUDE_LOG_LEVEL", "WARNING")

        config = PytestAgentsConfig.from_env()
        assert config.agent_pm_enabled is False
        assert config.agent_timeout == 45
        assert config.log_level == "WARNING"

    def test_to_dict(self) -> None:
        """Test converting config to dictionary."""
        config = PytestAgentsConfig()
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
        config = PytestAgentsConfig(
            project_root=temp_project_dir, agent_pm_path=custom_pm_path
        )
        assert config.agent_pm_path == custom_pm_path

    def test_feature_flags_default_values(self) -> None:
        """Test that feature flags have correct default values."""
        config = PytestAgentsConfig()
        assert config.enable_agent_caching is True
        assert config.enable_parallel_agents is False

    def test_feature_flags_custom_values(self) -> None:
        """Test that feature flags can be customized."""
        config = PytestAgentsConfig(
            enable_agent_caching=False, enable_parallel_agents=True
        )
        assert config.enable_agent_caching is False
        assert config.enable_parallel_agents is True

    def test_log_file_configuration(self, temp_project_dir: Path) -> None:
        """Test log file path configuration."""
        log_file = temp_project_dir / "pytest_agents.log"
        config = PytestAgentsConfig(log_file=log_file)
        assert config.log_file == log_file

    def test_from_env_comprehensive(self, monkeypatch, temp_project_dir: Path) -> None:
        """Test creating config from all environment variables."""
        monkeypatch.setenv("SUPERCLAUDE_AGENT_PM_ENABLED", "false")
        monkeypatch.setenv("SUPERCLAUDE_AGENT_RESEARCH_ENABLED", "false")
        monkeypatch.setenv("SUPERCLAUDE_AGENT_INDEX_ENABLED", "true")
        monkeypatch.setenv("SUPERCLAUDE_PROJECT_ROOT", str(temp_project_dir))
        monkeypatch.setenv("SUPERCLAUDE_AGENT_TIMEOUT", "60")
        monkeypatch.setenv("SUPERCLAUDE_AGENT_RETRY_COUNT", "5")
        monkeypatch.setenv("SUPERCLAUDE_LOG_LEVEL", "DEBUG")
        monkeypatch.setenv("SUPERCLAUDE_ENABLE_AGENT_CACHING", "false")
        monkeypatch.setenv("SUPERCLAUDE_ENABLE_PARALLEL_AGENTS", "true")

        config = PytestAgentsConfig.from_env()
        assert config.agent_pm_enabled is False
        assert config.agent_research_enabled is False
        assert config.agent_index_enabled is True
        assert config.project_root == temp_project_dir
        assert config.agent_timeout == 60
        assert config.agent_retry_count == 5
        assert config.log_level == "DEBUG"
        assert config.enable_agent_caching is False
        assert config.enable_parallel_agents is True

    def test_to_dict_includes_all_fields(self) -> None:
        """Test that to_dict includes all configuration fields."""
        config = PytestAgentsConfig()
        config_dict = config.to_dict()

        expected_keys = {
            "agent_pm_enabled",
            "agent_research_enabled",
            "agent_index_enabled",
            "project_root",
            "agent_pm_path",
            "agent_research_path",
            "agent_index_path",
            "agent_timeout",
            "agent_retry_count",
            "log_level",
            "log_file",
            "enable_agent_caching",
            "enable_parallel_agents",
            "metrics_enabled",
            "metrics_port",
            "metrics_host",
        }
        assert set(config_dict.keys()) == expected_keys

    def test_to_dict_paths_as_strings(self, temp_project_dir: Path) -> None:
        """Test that to_dict converts Path objects to strings."""
        log_file = temp_project_dir / "test.log"
        config = PytestAgentsConfig(project_root=temp_project_dir, log_file=log_file)
        config_dict = config.to_dict()

        assert isinstance(config_dict["project_root"], str)
        assert isinstance(config_dict["log_file"], str)
        assert config_dict["log_file"] == str(log_file)

    def test_metrics_configuration_defaults(self) -> None:
        """Test metrics configuration default values."""
        config = PytestAgentsConfig()
        assert config.metrics_enabled is False
        assert config.metrics_port == 9090
        assert config.metrics_host == "0.0.0.0"

    def test_metrics_configuration_custom(self) -> None:
        """Test metrics configuration with custom values."""
        config = PytestAgentsConfig(
            metrics_enabled=True, metrics_port=8080, metrics_host="localhost"
        )
        assert config.metrics_enabled is True
        assert config.metrics_port == 8080
        assert config.metrics_host == "localhost"

    def test_from_env_metrics_configuration(self, monkeypatch) -> None:
        """Test creating config with metrics from environment."""
        monkeypatch.setenv("SUPERCLAUDE_METRICS_ENABLED", "true")
        monkeypatch.setenv("SUPERCLAUDE_METRICS_PORT", "8080")
        monkeypatch.setenv("SUPERCLAUDE_METRICS_HOST", "127.0.0.1")

        config = PytestAgentsConfig.from_env()
        assert config.metrics_enabled is True
        assert config.metrics_port == 8080
        assert config.metrics_host == "127.0.0.1"

    def test_from_env_boolean_parsing_variations(self, monkeypatch) -> None:
        """Test various boolean string values in environment."""
        # Test TRUE value
        monkeypatch.setenv("SUPERCLAUDE_AGENT_PM_ENABLED", "TRUE")
        config = PytestAgentsConfig.from_env()
        assert config.agent_pm_enabled is True

        # Test False value
        monkeypatch.setenv("SUPERCLAUDE_AGENT_PM_ENABLED", "False")
        config = PytestAgentsConfig.from_env()
        assert config.agent_pm_enabled is False

        # Test non-true value defaults to false
        monkeypatch.setenv("SUPERCLAUDE_AGENT_PM_ENABLED", "anything")
        config = PytestAgentsConfig.from_env()
        assert config.agent_pm_enabled is False

    def test_to_dict_with_none_paths(self) -> None:
        """Test to_dict handles None values for optional paths."""
        config = PytestAgentsConfig()
        config.agent_pm_path = None
        config.log_file = None
        config_dict = config.to_dict()

        assert config_dict["agent_pm_path"] is None
        assert config_dict["log_file"] is None

    def test_from_pytest_config_with_ini_values(self, mock_pytest_config) -> None:
        """Test from_pytest_config with various ini values."""
        mock_pytest_config.inicfg = {
            "pytest_agents_agent_pm_enabled": False,
            "pytest_agents_agent_research_enabled": True,
            "pytest_agents_agent_index_enabled": False,
            "pytest_agents_agent_timeout": 45,
            "pytest_agents_agent_retry_count": 5,
            "pytest_agents_log_level": "DEBUG",
            "pytest_agents_enable_agent_caching": False,
            "pytest_agents_enable_parallel_agents": True,
        }

        config = PytestAgentsConfig.from_pytest_config(mock_pytest_config)
        assert config.agent_pm_enabled is False
        assert config.agent_research_enabled is True
        assert config.agent_index_enabled is False
        assert config.agent_timeout == 45
        assert config.agent_retry_count == 5
        assert config.log_level == "DEBUG"
        assert config.enable_agent_caching is False
        assert config.enable_parallel_agents is True
