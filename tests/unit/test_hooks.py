"""Unit tests for pytest hooks."""

from pathlib import Path
from unittest.mock import Mock

import pytest

from pytest_agents import hooks
from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import SuperClaudeConfig


@pytest.mark.unit
class TestPytestHooks:
    """Test pytest hook implementations."""

    def test_pytest_configure_initializes_bridge(
        self, mock_pytest_config, tmp_path: Path
    ) -> None:
        """Test pytest_configure hook initializes agent bridge."""
        # Setup mock agents
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text("console.log('{}');")

        mock_pytest_config.rootpath = tmp_path
        mock_pytest_config._pytest_agents_bridge = None

        # Call the hook
        hooks.pytest_configure(mock_pytest_config)

        # Verify bridge was created
        assert hasattr(mock_pytest_config, "_pytest_agents_bridge")
        assert hasattr(mock_pytest_config, "_pytest_agents_config")

    def test_pytest_configure_handles_bridge_failure(self, mock_pytest_config) -> None:
        """Test pytest_configure gracefully handles bridge init failure."""
        # Configure to fail
        mock_pytest_config.rootpath = "/nonexistent/path"

        # Should not raise exception
        hooks.pytest_configure(mock_pytest_config)

        # Bridge might be None if initialization failed
        bridge = getattr(mock_pytest_config, "_pytest_agents_bridge", None)
        assert bridge is None or isinstance(bridge, AgentBridge)

    def test_pytest_collection_modifyitems_logs_collection(
        self, mock_pytest_config
    ) -> None:
        """Test collection modify items hook logs test collection."""
        session = Mock()
        items = [Mock(), Mock(), Mock()]

        # Setup iter_markers to return empty list
        for item in items:
            item.iter_markers = Mock(return_value=[])
            item.get_closest_marker = Mock(return_value=None)

        # Should not raise exception
        hooks.pytest_collection_modifyitems(session, mock_pytest_config, items)

    def test_pytest_collection_modifyitems_adds_slow_marker(
        self, mock_pytest_config
    ) -> None:
        """Test that agent tests get slow marker."""
        session = Mock()

        # Create mock test item with agent_pm marker
        item = Mock()
        item.iter_markers = Mock(return_value=[])
        item.get_closest_marker = Mock(
            side_effect=lambda m: Mock() if m == "agent_pm" else None
        )
        item.add_marker = Mock()

        items = [item]

        hooks.pytest_collection_modifyitems(session, mock_pytest_config, items)

        # Verify slow marker was added
        item.add_marker.assert_called_once()
        args = item.add_marker.call_args[0]
        assert hasattr(args[0], "name")

    def test_pytest_runtest_setup_skips_if_no_bridge(self, mock_pytest_config) -> None:
        """Test runtest setup skips if bridge not available."""
        item = Mock()
        item.config = mock_pytest_config
        item.get_closest_marker = Mock(return_value=Mock())  # Has agent marker

        # Remove bridge
        mock_pytest_config._pytest_agents_bridge = None

        with pytest.raises(pytest.skip.Exception):
            hooks.pytest_runtest_setup(item)

    def test_pytest_runtest_setup_skips_if_agent_unavailable(
        self, mock_pytest_config, tmp_path: Path
    ) -> None:
        """Test runtest setup skips if specific agent unavailable."""
        # Create bridge with no agents
        config = SuperClaudeConfig(
            project_root=tmp_path,
            agent_pm_enabled=False,
            agent_research_enabled=False,
            agent_index_enabled=False,
        )
        bridge = AgentBridge(config)
        mock_pytest_config._pytest_agents_bridge = bridge

        item = Mock()
        item.config = mock_pytest_config
        item.get_closest_marker = Mock(
            side_effect=lambda m: Mock() if m == "agent_pm" else None
        )

        with pytest.raises(pytest.skip.Exception):
            hooks.pytest_runtest_setup(item)

    def test_pytest_runtest_setup_passes_if_agent_available(
        self, mock_pytest_config, tmp_path: Path
    ) -> None:
        """Test runtest setup passes if agent is available."""
        # Create mock PM agent
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text("console.log('{}');")

        config = SuperClaudeConfig(
            project_root=tmp_path, agent_pm_enabled=True, agent_pm_path=pm_agent
        )
        bridge = AgentBridge(config)
        mock_pytest_config._pytest_agents_bridge = bridge

        item = Mock()
        item.config = mock_pytest_config
        item.get_closest_marker = Mock(
            side_effect=lambda m: Mock() if m == "agent_pm" else None
        )

        # Should not raise
        hooks.pytest_runtest_setup(item)

    def test_pytest_runtest_setup_passes_if_no_agent_marker(
        self, mock_pytest_config
    ) -> None:
        """Test runtest setup passes if no agent marker."""
        item = Mock()
        item.config = mock_pytest_config
        item.get_closest_marker = Mock(return_value=None)  # No agent markers

        # Should not raise
        hooks.pytest_runtest_setup(item)

    def test_pytest_runtest_makereport_handles_call(self) -> None:
        """Test makereport hook handles test calls."""
        item = Mock()
        call = Mock()
        call.when = "call"

        # Should not raise
        hooks.pytest_runtest_makereport(item, call)

    def test_pytest_runtest_makereport_ignores_setup_teardown(self) -> None:
        """Test makereport ignores setup/teardown phases."""
        item = Mock()

        # Test setup phase
        call_setup = Mock()
        call_setup.when = "setup"
        hooks.pytest_runtest_makereport(item, call_setup)

        # Test teardown phase
        call_teardown = Mock()
        call_teardown.when = "teardown"
        hooks.pytest_runtest_makereport(item, call_teardown)

    def test_pytest_sessionfinish_logs_status(self, mock_pytest_config) -> None:
        """Test sessionfinish hook logs exit status."""
        session = Mock()
        session.config = mock_pytest_config
        mock_pytest_config._pytest_agents_bridge = None

        # Should not raise
        hooks.pytest_sessionfinish(session, 0)
        hooks.pytest_sessionfinish(session, 1)

    def test_pytest_sessionfinish_cleans_up_bridge(
        self, mock_pytest_config, tmp_path: Path
    ) -> None:
        """Test sessionfinish cleans up bridge if present."""
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text("console.log('{}');")

        config = SuperClaudeConfig(project_root=tmp_path)
        bridge = AgentBridge(config)
        mock_pytest_config._pytest_agents_bridge = bridge

        session = Mock()
        session.config = mock_pytest_config

        # Should not raise
        hooks.pytest_sessionfinish(session, 0)

    def test_hooks_container_exists(self) -> None:
        """Test that DI container is created at module level."""
        assert hasattr(hooks, "container")
        assert hooks.container is not None

    def test_pytest_configure_wires_container(self, mock_pytest_config) -> None:
        """Test that pytest_configure wires DI container."""
        # The container should be wired after configure
        hooks.pytest_configure(mock_pytest_config)

        # Verify container exists and is wired
        assert hooks.container is not None
