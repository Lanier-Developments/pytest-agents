"""Unit tests for EnvConfigFactory."""

from unittest.mock import patch

import pytest

from pytest_agents.config import PytestAgentsConfig
from pytest_agents.infrastructure.env_config_factory import EnvConfigFactory


@pytest.mark.unit
class TestEnvConfigFactory:
    """Test cases for EnvConfigFactory."""

    def test_initialization(self) -> None:
        """Test EnvConfigFactory can be instantiated."""
        factory = EnvConfigFactory()
        assert factory is not None

    @patch("pytest_agents.config.PytestAgentsConfig.from_env")
    def test_create_returns_config_from_env(self, mock_from_env: patch) -> None:
        """Test create() calls PytestAgentsConfig.from_env()."""
        factory = EnvConfigFactory()

        # Mock the from_env method
        expected_config = PytestAgentsConfig()
        mock_from_env.return_value = expected_config

        result = factory.create()

        assert result == expected_config
        mock_from_env.assert_called_once()

    def test_create_returns_pytest_agents_config_instance(self) -> None:
        """Test create() returns a PytestAgentsConfig instance."""
        factory = EnvConfigFactory()

        result = factory.create()

        assert isinstance(result, PytestAgentsConfig)
