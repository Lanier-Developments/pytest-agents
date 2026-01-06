"""Environment-based configuration factory."""

from superclaude.config import SuperClaudeConfig


class EnvConfigFactory:
    """Factory for creating SuperClaudeConfig from environment.

    Implements IConfigFactory protocol.
    """

    def create(self) -> SuperClaudeConfig:
        """Create configuration from environment variables."""
        return SuperClaudeConfig.from_env()
