"""Application DI container for pytest-agents."""

from dependency_injector import containers, providers

from pytest_agents.agent_bridge import AgentBridge, AgentClient
from pytest_agents.config import PytestAgentsConfig
from pytest_agents.infrastructure.env_config_factory import EnvConfigFactory
from pytest_agents.infrastructure.prometheus_metrics import PrometheusMetrics
from pytest_agents.infrastructure.subprocess_runner import SubprocessRunner


class ApplicationContainer(containers.DeclarativeContainer):
    """Main DI container for pytest-agents pytest plugin."""

    # Configuration
    config = providers.Configuration()

    # Infrastructure providers
    process_runner = providers.Singleton(SubprocessRunner)
    config_factory = providers.Singleton(EnvConfigFactory)
    metrics = providers.Singleton(PrometheusMetrics)

    # Core providers
    pytest_agents_config = providers.Singleton(PytestAgentsConfig.from_env)

    # Agent client factory - creates clients with injected process_runner
    agent_client_factory = providers.Factory(AgentClient, process_runner=process_runner)

    # Agent bridge (singleton)
    agent_bridge = providers.Singleton(
        AgentBridge,
        config=pytest_agents_config,
        client_factory=agent_client_factory.provider,
        process_runner=process_runner,
        metrics=metrics,
    )
