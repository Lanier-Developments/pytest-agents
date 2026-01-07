"""Protocol interfaces for dependency injection."""

from pytest_agents.interfaces.core import (
    IAgentClient,
    IConfigFactory,
    IFileSystem,
    IProcessRunner,
)

__all__ = [
    "IProcessRunner",
    "IFileSystem",
    "IAgentClient",
    "IConfigFactory",
]
