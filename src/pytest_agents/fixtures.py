"""Custom pytest fixtures for SuperClaude."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict

import pytest

from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import SuperClaudeConfig


@pytest.fixture(scope="session")
def superclaude_config(request: Any) -> SuperClaudeConfig:
    """Fixture providing SuperClaude configuration.

    Args:
        request: Pytest request object

    Returns:
        SuperClaudeConfig: Configuration instance
    """
    return SuperClaudeConfig.from_pytest_config(request.config)


@pytest.fixture(scope="session")
def superclaude_agent(superclaude_config: SuperClaudeConfig) -> AgentBridge:
    """Fixture providing access to agents from tests.

    Args:
        superclaude_config: Configuration fixture

    Returns:
        AgentBridge: Agent bridge instance

    Example:
        @pytest.mark.agent_pm
        def test_with_pm_agent(superclaude_agent):
            result = superclaude_agent.invoke_agent('pm', 'track_tasks')
            assert result['status'] == 'success'
    """
    return AgentBridge(superclaude_config)


@pytest.fixture
def project_context(request: Any) -> Dict[str, Any]:
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
def agent_coordinator(superclaude_agent: AgentBridge) -> "AgentCoordinator":
    """Fixture for multi-agent coordination.

    Args:
        superclaude_agent: Agent bridge fixture

    Returns:
        AgentCoordinator: Coordinator instance

    Example:
        def test_multi_agent(agent_coordinator):
            results = agent_coordinator.run_parallel([
                ('pm', 'track_tasks'),
                ('index', 'index_repository')
            ])
    """
    return AgentCoordinator(superclaude_agent)


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
