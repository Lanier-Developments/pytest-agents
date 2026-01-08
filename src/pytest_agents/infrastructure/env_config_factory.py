"""Environment-based configuration factory."""

from pytest_agents.config import PytestAgentsConfig


class EnvConfigFactory:
    """Factory for creating PytestAgentsConfig from environment.

    Implements IConfigFactory protocol.
    """

    def create(self) -> PytestAgentsConfig:
        """Create configuration from environment variables."""
        return PytestAgentsConfig.from_env()
