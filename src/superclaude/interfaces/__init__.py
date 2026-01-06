"""Protocol interfaces for dependency injection."""

from superclaude.interfaces.core import (
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
