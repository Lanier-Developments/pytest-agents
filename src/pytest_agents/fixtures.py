"""Custom pytest fixtures for pytest-agents."""

from concurrent.futures import ThreadPoolExecutor, as_completed  # pragma: no cover
from pathlib import Path  # pragma: no cover
from typing import Any, Dict  # pragma: no cover

import pytest  # pragma: no cover

from pytest_agents.agent_bridge import AgentBridge  # pragma: no cover
from pytest_agents.config import PytestAgentsConfig  # pragma: no cover


@pytest.fixture(scope="session")
def pytest_agents_config(request: Any) -> PytestAgentsConfig:  # pragma: no cover
    """Fixture providing pytest-agents configuration.

    Args:
        request: Pytest request object

    Returns:
        PytestAgentsConfig: Configuration instance
    """
    return PytestAgentsConfig.from_pytest_config(request.config)


@pytest.fixture(scope="session")
def pytest_agents_agent(
    pytest_agents_config: PytestAgentsConfig,
) -> AgentBridge:  # pragma: no cover
    """Fixture providing access to agents from tests.

    Args:
        pytest_agents_config: Configuration fixture

    Returns:
        AgentBridge: Agent bridge instance

    Example:
        @pytest.mark.agent_pm
        def test_with_pm_agent(pytest_agents_agent):
            result = pytest_agents_agent.invoke_agent('pm', 'track_tasks')
            assert result['status'] == 'success'
    """
    return AgentBridge(pytest_agents_config)


@pytest.fixture
def project_context(request: Any) -> Dict[str, Any]:  # pragma: no cover
    """Fixture providing project metadata and context.

    Args:
        request: Pytest request object

    Returns:
        Dict[str, Any]: Project context including paths and metadata
    """
    return {
        "root_path": Path(request.config.rootpath),
        "test_path": Path(request.node.fspath)
        if hasattr(request.node, "fspath")
        else None,
        "test_name": request.node.name,
        "markers": [marker.name for marker in request.node.iter_markers()],
    }


@pytest.fixture
def agent_coordinator(
    pytest_agents_agent: AgentBridge,
) -> "AgentCoordinator":  # pragma: no cover
    """Fixture for multi-agent coordination.

    Args:
        pytest_agents_agent: Agent bridge fixture

    Returns:
        AgentCoordinator: Coordinator instance

    Example:
        def test_multi_agent(agent_coordinator):
            results = agent_coordinator.run_parallel([
                ('pm', 'track_tasks'),
                ('index', 'index_repository')
            ])
    """
    return AgentCoordinator(pytest_agents_agent)


class AgentCoordinator:
    """Coordinator for running multiple agents."""

    def __init__(self, bridge: AgentBridge) -> None:
        """Initialize coordinator.

        Args:
            bridge: Agent bridge instance
        """
        self.bridge = bridge

    def run_sequential(
        self, tasks: list[tuple[str, str, Dict[str, Any]]]
    ) -> list[Dict[str, Any]]:
        """Run agent tasks sequentially.

        Args:
            tasks: List of (agent_name, action, params) tuples

        Returns:
            list[Dict[str, Any]]: List of agent responses
        """
        results = []
        for agent_name, action, params in tasks:
            result = self.bridge.invoke_agent(agent_name, action, params)
            results.append(result)
        return results

    def run_parallel(
        self,
        tasks: list[tuple[str, str, Dict[str, Any]]],
        max_workers: int | None = None,
    ) -> list[Dict[str, Any]]:
        """Run agent tasks in parallel using threads.

        Uses ThreadPoolExecutor to execute multiple agent invocations concurrently.
        Each agent runs in a separate subprocess, so thread-based parallelism is safe.

        Args:
            tasks: List of (agent_name, action, params) tuples
            max_workers: Maximum number of parallel workers.
                Defaults to min(len(tasks), 5)

        Returns:
            list[Dict[str, Any]]: List of agent responses in the same order
                as input tasks

        Example:
            results = coordinator.run_parallel([
                ('pm', 'ping', {}),
                ('research', 'ping', {}),
                ('index', 'ping', {})
            ])

        Note:
            Results are returned in the same order as the input tasks, even though
            execution happens concurrently.
        """
        if not tasks:
            return []

        # Default to min of tasks count or 5 workers
        if max_workers is None:
            max_workers = min(len(tasks), 5)

        # Create a mapping to preserve order
        results = [None] * len(tasks)

        def execute_task(
            index: int, agent_name: str, action: str, params: Dict[str, Any]
        ) -> tuple[int, Dict[str, Any]]:
            """Execute a single agent task and return with its index."""
            result = self.bridge.invoke_agent(agent_name, action, params)
            return (index, result)

        # Execute tasks in parallel
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            futures = {
                executor.submit(execute_task, i, agent_name, action, params): i
                for i, (agent_name, action, params) in enumerate(tasks)
            }

            # Collect results as they complete
            for future in as_completed(futures):
                index, result = future.result()
                results[index] = result

        return results
