"""Pytest hook implementations for SuperClaude."""

from typing import Any, List, Optional

import pytest

from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import SuperClaudeConfig
from pytest_agents.di.container import ApplicationContainer
from pytest_agents.markers import MarkerRegistry
from pytest_agents.utils.logging import setup_logger

logger = setup_logger(__name__)

# Create global container instance
container = ApplicationContainer()


def pytest_configure(config: Any) -> None:
    """Hook called after command line options are parsed.

    Args:
        config: Pytest config object
    """
    logger.info("Initializing pytest-agents plugin")

    # Register custom markers
    marker_registry = MarkerRegistry()
    marker_registry.register_markers(config)

    # Store config in plugin object
    plugin_config = SuperClaudeConfig.from_pytest_config(config)
    config._pytest_agents_config = plugin_config

    # Wire container to modules for dependency injection
    container.wire(
        modules=["pytest_agents.hooks", "pytest_agents.fixtures", "pytest_agents.cli"]
    )

    # Initialize agent bridge using DI
    try:
        # Resolve agent bridge from container
        agent_bridge = container.agent_bridge()
        config._pytest_agents_bridge = agent_bridge
        logger.info(f"Agents available: {agent_bridge.get_available_agents()}")
    except Exception as e:
        logger.warning(f"Failed to initialize agent bridge: {e}")
        # Fallback to direct instantiation for backwards compatibility
        try:
            agent_bridge = AgentBridge(plugin_config)
            config._pytest_agents_bridge = agent_bridge
            logger.info("Using fallback AgentBridge (no DI)")
        except Exception as fallback_error:
            logger.error(f"Fallback also failed: {fallback_error}")
            config._pytest_agents_bridge = None


def pytest_collection_modifyitems(session: Any, config: Any, items: List[Any]) -> None:
    """Hook called after test collection.

    Args:
        session: Pytest session object
        config: Pytest config object
        items: List of collected test items
    """
    logger.debug(f"Collected {len(items)} test items")

    # Validate markers
    marker_registry = MarkerRegistry()
    marker_registry.validate_markers(items)

    # Apply marker-based modifications
    for item in items:
        # Add slow marker to agent tests if not already marked
        agent_markers = [
            "agent_pm",
            "agent_research",
            "agent_index",
        ]
        has_agent_marker = any(
            item.get_closest_marker(marker) for marker in agent_markers
        )

        if has_agent_marker and not item.get_closest_marker("slow"):
            item.add_marker(pytest.mark.slow)


def pytest_runtest_setup(item: Any) -> None:
    """Hook called before running a test.

    Args:
        item: Test item about to be run
    """
    # Check if test requires agents
    agent_markers = {
        "agent_pm": "pm",
        "agent_research": "research",
        "agent_index": "index",
    }

    for marker_name, agent_name in agent_markers.items():
        if item.get_closest_marker(marker_name):
            bridge: Optional[AgentBridge] = getattr(
                item.config, "_pytest_agents_bridge", None
            )
            if bridge is None:
                pytest.skip("Agent bridge not available")
            elif not bridge.is_agent_available(agent_name):
                pytest.skip(f"Agent '{agent_name}' not available")


def pytest_runtest_makereport(item: Any, call: Any) -> None:
    """Hook called after test execution.

    Args:
        item: Test item that was run
        call: Call information
    """
    if call.when == "call":
        # Could send test results to agents for analysis
        pass


def pytest_sessionfinish(session: Any, exitstatus: int) -> None:
    """Hook called at end of test session.

    Args:
        session: Pytest session object
        exitstatus: Exit status of the test session
    """
    logger.info(f"Test session finished with status: {exitstatus}")

    # Cleanup
    bridge: Optional[AgentBridge] = getattr(
        session.config, "_pytest_agents_bridge", None
    )
    if bridge:
        logger.debug("Cleaning up agent bridge")
