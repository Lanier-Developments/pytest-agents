"""Unit tests for the main plugin."""

import pytest

from superclaude import __version__
from superclaude.plugin import SuperClaudePlugin


@pytest.mark.unit
class TestSuperClaudePlugin:
    """Test cases for SuperClaudePlugin."""

    def test_plugin_initialization(self) -> None:
        """Test plugin can be initialized."""
        plugin = SuperClaudePlugin()
        assert plugin is not None
        assert plugin.version == __version__

    def test_plugin_repr(self) -> None:
        """Test plugin string representation."""
        plugin = SuperClaudePlugin()
        repr_str = repr(plugin)
        assert "SuperClaudePlugin" in repr_str
        assert __version__ in repr_str

    def test_plugin_has_version(self) -> None:
        """Test plugin has version attribute."""
        plugin = SuperClaudePlugin()
        assert hasattr(plugin, "version")
        assert isinstance(plugin.version, str)
        assert plugin.version == __version__
