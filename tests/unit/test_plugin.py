"""Unit tests for the main plugin."""

import pytest

from pytest_agents import __version__
from pytest_agents.plugin import PytestAgentsPlugin


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
