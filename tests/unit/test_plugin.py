"""Unit tests for the main plugin."""

from unittest.mock import Mock

import pytest

from pytest_agents import __version__
from pytest_agents.plugin import PytestAgentsPlugin, pytest_addoption


@pytest.mark.unit
class TestPytestAgentsPlugin:
    """Test cases for PytestAgentsPlugin."""

    def test_plugin_initialization(self) -> None:
        """Test plugin can be initialized."""
        plugin = PytestAgentsPlugin()
        assert plugin is not None
        assert plugin.version == __version__

    def test_plugin_repr(self) -> None:
        """Test plugin string representation."""
        plugin = PytestAgentsPlugin()
        repr_str = repr(plugin)
        assert "PytestAgentsPlugin" in repr_str
        assert __version__ in repr_str

    def test_plugin_has_version(self) -> None:
        """Test plugin has version attribute."""
        plugin = PytestAgentsPlugin()
        assert hasattr(plugin, "version")
        assert isinstance(plugin.version, str)
        assert plugin.version == __version__


@pytest.mark.unit
class TestPytestAddoption:
    """Test pytest_addoption hook."""

    def test_pytest_addoption_adds_options(self) -> None:
        """Test that pytest_addoption adds command line options."""
        mock_parser = Mock()
        mock_group = Mock()
        mock_parser.getgroup.return_value = mock_group

        pytest_addoption(mock_parser)

        # Verify group was created
        mock_parser.getgroup.assert_called_once_with("pytest-agents")

        # Verify both options were added
        assert mock_group.addoption.call_count == 2

        # Check first call (--pytest-agents-no-agents)
        first_call = mock_group.addoption.call_args_list[0]
        assert first_call[0][0] == "--pytest-agents-no-agents"
        assert first_call[1]["action"] == "store_true"
        assert first_call[1]["default"] is False

        # Check second call (--pytest-agents-agent-timeout)
        second_call = mock_group.addoption.call_args_list[1]
        assert second_call[0][0] == "--pytest-agents-agent-timeout"
        assert second_call[1]["action"] == "store"
        assert second_call[1]["default"] == 30
        assert second_call[1]["type"] is int


@pytest.mark.unit
class TestPluginExports:
    """Test plugin module exports."""

    def test_all_exports_defined(self) -> None:
        """Test __all__ contains expected exports."""
        from pytest_agents import plugin

        assert hasattr(plugin, "__all__")
        assert "PytestAgentsPlugin" in plugin.__all__
        assert "pytest_configure" in plugin.__all__
        assert "pytest_collection_modifyitems" in plugin.__all__
        assert "pytest_runtest_setup" in plugin.__all__
        assert "pytest_runtest_makereport" in plugin.__all__
        assert "pytest_sessionfinish" in plugin.__all__

    def test_hooks_are_importable(self) -> None:
        """Test that pytest hooks can be imported from plugin."""
        from pytest_agents.plugin import (
            pytest_collection_modifyitems,
            pytest_configure,
            pytest_runtest_makereport,
            pytest_runtest_setup,
            pytest_sessionfinish,
        )

        assert pytest_configure is not None
        assert pytest_collection_modifyitems is not None
        assert pytest_runtest_setup is not None
        assert pytest_runtest_makereport is not None
        assert pytest_sessionfinish is not None
