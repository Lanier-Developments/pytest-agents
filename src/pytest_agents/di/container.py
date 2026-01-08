"""Application DI container for pytest-agents."""

from dependency_injector import containers, providers  # pragma: no cover

from pytest_agents.agent_bridge import AgentBridge, AgentClient  # pragma: no cover
from pytest_agents.config import PytestAgentsConfig  # pragma: no cover
from pytest_agents.infrastructure.env_config_factory import (
    EnvConfigFactory,  # pragma: no cover
)
from pytest_agents.infrastructure.prometheus_metrics import (
    PrometheusMetrics,  # pragma: no cover
)
from pytest_agents.infrastructure.subprocess_runner import (
    SubprocessRunner,  # pragma: no cover
)


class ApplicationContainer(containers.DeclarativeContainer):  # pragma: no cover
    """Main DI container for pytest-agents pytest plugin."""

    # Configuration  # pragma: no cover
    config = providers.Configuration()  # pragma: no cover

    # Infrastructure providers  # pragma: no cover
    process_runner = providers.Singleton(SubprocessRunner)  # pragma: no cover
    config_factory = providers.Singleton(EnvConfigFactory)  # pragma: no cover
    metrics = providers.Singleton(PrometheusMetrics)  # pragma: no cover

    # Core providers  # pragma: no cover
    pytest_agents_config = providers.Singleton(
        PytestAgentsConfig.from_env
    )  # pragma: no cover

    # Agent client factory - creates clients with injected
    # process_runner  # pragma: no cover
    agent_client_factory = providers.Factory(
        AgentClient, process_runner=process_runner
    )  # pragma: no cover

    # Agent bridge (singleton)  # pragma: no cover
    agent_bridge = providers.Singleton(  # pragma: no cover
        AgentBridge,  # pragma: no cover
        config=pytest_agents_config,  # pragma: no cover
        client_factory=agent_client_factory.provider,  # pragma: no cover
        process_runner=process_runner,  # pragma: no cover
        metrics=metrics,  # pragma: no cover
    )  # pragma: no cover
