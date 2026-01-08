"""Environment-based configuration factory."""

from pytest_agents.config import PytestAgentsConfig  # pragma: no cover


class EnvConfigFactory:  # pragma: no cover
    """Factory for creating PytestAgentsConfig from environment.

    Implements IConfigFactory protocol.
    """

    def create(self) -> PytestAgentsConfig:  # pragma: no cover
        """Create configuration from environment variables."""
        return PytestAgentsConfig.from_env()
