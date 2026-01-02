"""Main pytest plugin entry point for SuperClaude."""

from typing import Any

import pytest

from superclaude import __version__
from superclaude.hooks import (
    pytest_collection_modifyitems,
    pytest_configure,
    pytest_runtest_makereport,
    pytest_runtest_setup,
    pytest_sessionfinish,
)


class SuperClaudePlugin:
    """Main pytest plugin class for SuperClaude framework."""

    def __init__(self) -> None:
        """Initialize the plugin."""
        self.version = __version__

    def __repr__(self) -> str:
        """Return string representation of the plugin.

        Returns:
            str: Plugin representation
        """
        return f"SuperClaudePlugin(version={self.version})"


# Export pytest hooks
__all__ = [
    "SuperClaudePlugin",
    "pytest_configure",
    "pytest_collection_modifyitems",
    "pytest_runtest_setup",
    "pytest_runtest_makereport",
    "pytest_sessionfinish",
]


# For pytest plugin discovery
def pytest_addoption(parser: Any) -> None:
    """Add command line options for SuperClaude.

    Args:
        parser: Pytest parser object
    """
    group = parser.getgroup("superclaude")
    group.addoption(
        "--superclaude-no-agents",
        action="store_true",
        default=False,
        help="Disable all agent functionality",
    )
    group.addoption(
        "--superclaude-agent-timeout",
        action="store",
        default=30,
        type=int,
        help="Agent invocation timeout in seconds (default: 30)",
    )
