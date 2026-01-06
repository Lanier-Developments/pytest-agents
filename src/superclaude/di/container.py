"""Application DI container for SuperClaude."""

from dependency_injector import containers, providers

from superclaude.agent_bridge import AgentBridge, AgentClient
from superclaude.config import SuperClaudeConfig
from superclaude.infrastructure.env_config_factory import EnvConfigFactory
from superclaude.infrastructure.prometheus_metrics import PrometheusMetrics
from superclaude.infrastructure.subprocess_runner import SubprocessRunner


class ApplicationContainer(containers.DeclarativeContainer):
    """Main DI container for SuperClaude pytest plugin."""

    # Configuration
    config = providers.Configuration()

    # Infrastructure providers
    process_runner = providers.Singleton(SubprocessRunner)
    config_factory = providers.Singleton(EnvConfigFactory)
    metrics = providers.Singleton(PrometheusMetrics)

    # Core providers
    superclaude_config = providers.Singleton(
        SuperClaudeConfig.from_env
    )

    # Agent client factory - creates clients with injected process_runner
    agent_client_factory = providers.Factory(
        AgentClient,
        process_runner=process_runner
    )

    # Agent bridge (singleton) - gets config, client factory, process runner, and metrics
    agent_bridge = providers.Singleton(
        AgentBridge,
        config=superclaude_config,
        client_factory=agent_client_factory.provider,
        process_runner=process_runner,
        metrics=metrics
    )
