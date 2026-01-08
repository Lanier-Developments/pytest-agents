"""Shared fixtures for SuperClaude tests."""

from pathlib import Path
from unittest.mock import MagicMock

import pytest

from pytest_agents.config import PytestAgentsConfig


@pytest.fixture
def mock_config() -> PytestAgentsConfig:
    """Fixture providing a mock configuration.

    Returns:
        PytestAgentsConfig: Test configuration
    """
    return PytestAgentsConfig(
        agent_pm_enabled=True,
        agent_research_enabled=True,
        agent_index_enabled=True,
        project_root=Path("/tmp/test_project"),
        agent_timeout=10,
        agent_retry_count=1,
        log_level="DEBUG",
    )


@pytest.fixture
def mock_pytest_config() -> MagicMock:
    """Fixture providing a mock pytest config object.

    Returns:
        MagicMock: Mock pytest config
    """
    config = MagicMock()
    config.rootpath = Path("/tmp/test_project")
    config.inicfg = {}
    config.option = MagicMock()
    return config


@pytest.fixture
def temp_project_dir(tmp_path: Path) -> Path:
    """Fixture providing a temporary project directory.

    Args:
        tmp_path: Pytest tmp_path fixture

    Returns:
        Path: Temporary project directory
    """
    project_dir = tmp_path / "test_project"
    project_dir.mkdir()
    return project_dir
