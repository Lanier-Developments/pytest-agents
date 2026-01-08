"""Main pytest plugin entry point for pytest-agents."""

from typing import Any  # pragma: no cover

from pytest_agents import __version__  # pragma: no cover
from pytest_agents.hooks import (  # pragma: no cover
    pytest_collection_modifyitems,
    pytest_configure,
    pytest_runtest_makereport,
    pytest_runtest_setup,
    pytest_sessionfinish,
)


class PytestAgentsPlugin:  # pragma: no cover
    """Main pytest plugin class for pytest-agents framework."""

    def __init__(self) -> None:  # pragma: no cover
        """Initialize the plugin."""
        self.version = __version__

    def __repr__(self) -> str:  # pragma: no cover
        """Return string representation of the plugin.

        Returns:
            str: Plugin representation
        """
        return f"PytestAgentsPlugin(version={self.version})"


# Export pytest hooks
__all__ = [  # pragma: no cover
    "PytestAgentsPlugin",
    "pytest_configure",
    "pytest_collection_modifyitems",
    "pytest_runtest_setup",
    "pytest_runtest_makereport",
    "pytest_sessionfinish",
]


# For pytest plugin discovery
def pytest_addoption(parser: Any) -> None:  # pragma: no cover
    """Add command line options for pytest-agents.

    Args:
        parser: Pytest parser object
    """
    group = parser.getgroup("pytest-agents")
    group.addoption(
        "--pytest-agents-no-agents",
        action="store_true",
        default=False,
        help="Disable all agent functionality",
    )
    group.addoption(
        "--pytest-agents-agent-timeout",
        action="store",
        default=30,
        type=int,
        help="Agent invocation timeout in seconds (default: 30)",
    )
