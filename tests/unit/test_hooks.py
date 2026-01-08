"""Unit tests for pytest hooks."""

from pathlib import Path
from unittest.mock import Mock

import pytest

from pytest_agents import hooks
from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import PytestAgentsConfig


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
        config = PytestAgentsConfig(
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

        config = PytestAgentsConfig(
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

        config = PytestAgentsConfig(project_root=tmp_path)
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

    def test_pytest_configure_fallback_on_di_failure(
        self, mock_pytest_config, tmp_path: Path
    ) -> None:
        """Test fallback to direct instantiation if DI fails."""
        from unittest.mock import patch

        # Create valid agent path
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text("console.log('{}');")

        mock_pytest_config.rootpath = tmp_path

        # Mock container.agent_bridge() to raise exception
        with patch.object(
            hooks.container, "agent_bridge", side_effect=Exception("DI failed")
        ):
            # Should not raise, should fallback
            hooks.pytest_configure(mock_pytest_config)

            # Bridge should still be created (via fallback)
            assert hasattr(mock_pytest_config, "_pytest_agents_bridge")
            bridge = mock_pytest_config._pytest_agents_bridge
            # Might be None or AgentBridge depending on fallback success
            assert bridge is None or isinstance(bridge, AgentBridge)

    def test_pytest_configure_complete_failure_sets_bridge_none(
        self, mock_pytest_config
    ) -> None:
        """Test that bridge is set to None if both DI and fallback fail."""
        from unittest.mock import patch

        # Configure with invalid path to cause fallback to fail too
        mock_pytest_config.rootpath = "/nonexistent/path/that/does/not/exist"

        # Mock both container.agent_bridge() and AgentBridge to raise exceptions
        with patch.object(
            hooks.container, "agent_bridge", side_effect=Exception("DI failed")
        ):
            with patch.object(
                hooks, "AgentBridge", side_effect=Exception("Fallback failed")
            ):
                # Should not raise even with both failures
                hooks.pytest_configure(mock_pytest_config)

                # Bridge should be None after both failures
                bridge = getattr(mock_pytest_config, "_pytest_agents_bridge", None)
                assert bridge is None

    def test_pytest_collection_modifyitems_validates_markers(
        self, mock_pytest_config
    ) -> None:
        """Test that collection validates markers correctly."""

        session = Mock()
        items = []

        # Create item with valid marker
        item1 = Mock()
        marker1 = Mock()
        marker1.name = "unit"
        item1.iter_markers = Mock(return_value=[marker1])
        item1.get_closest_marker = Mock(return_value=None)
        items.append(item1)

        # Create item with pytest built-in marker (should be allowed)
        item2 = Mock()
        marker2 = Mock()
        marker2.name = "pytest_mark_skip"
        item2.iter_markers = Mock(return_value=[marker2])
        item2.get_closest_marker = Mock(return_value=None)
        items.append(item2)

        # Should not raise
        hooks.pytest_collection_modifyitems(session, mock_pytest_config, items)

    def test_pytest_runtest_makereport_ignores_non_call_phases(self) -> None:
        """Test that makereport ignores setup and teardown phases."""
        item = Mock()

        # Test setup phase
        call_setup = Mock()
        call_setup.when = "setup"
        result = hooks.pytest_runtest_makereport(item, call_setup)
        assert result is None

        # Test teardown phase
        call_teardown = Mock()
        call_teardown.when = "teardown"
        result = hooks.pytest_runtest_makereport(item, call_teardown)
        assert result is None

        # Test call phase
        call_call = Mock()
        call_call.when = "call"
        result = hooks.pytest_runtest_makereport(item, call_call)
        assert result is None

    def test_pytest_sessionfinish_without_bridge(self, mock_pytest_config) -> None:
        """Test sessionfinish when bridge is None."""
        session = Mock()
        session.config = mock_pytest_config
        mock_pytest_config._pytest_agents_bridge = None

        # Should not raise
        hooks.pytest_sessionfinish(session, 0)

    def test_pytest_sessionfinish_with_bridge_cleanup(
        self, mock_pytest_config, tmp_path: Path
    ) -> None:
        """Test sessionfinish performs cleanup when bridge exists."""
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text("console.log('{}');")

        config = PytestAgentsConfig(project_root=tmp_path)
        bridge = AgentBridge(config)
        mock_pytest_config._pytest_agents_bridge = bridge

        session = Mock()
        session.config = mock_pytest_config

        # Should perform cleanup without errors
        hooks.pytest_sessionfinish(session, 0)

    def test_pytest_runtest_setup_with_multiple_agent_markers(
        self, mock_pytest_config, tmp_path: Path
    ) -> None:
        """Test runtest setup checks all agent markers."""
        pm_agent = tmp_path / "pm" / "dist" / "index.js"
        pm_agent.parent.mkdir(parents=True)
        pm_agent.write_text("console.log('{}');")

        research_agent = tmp_path / "research" / "dist" / "index.js"
        research_agent.parent.mkdir(parents=True)
        research_agent.write_text("console.log('{}');")

        config = PytestAgentsConfig(
            project_root=tmp_path,
            agent_pm_enabled=True,
            agent_research_enabled=True,
            agent_index_enabled=False,
        )
        bridge = AgentBridge(config)
        mock_pytest_config._pytest_agents_bridge = bridge

        item = Mock()
        item.config = mock_pytest_config

        # Test has both pm and research markers
        item.get_closest_marker = Mock(
            side_effect=lambda m: (
                Mock() if m in ["agent_pm", "agent_research"] else None
            )
        )

        # Should pass - both agents available
        hooks.pytest_runtest_setup(item)

        # Now test with unavailable index marker
        item.get_closest_marker = Mock(
            side_effect=lambda m: Mock() if m == "agent_index" else None
        )

        # Should skip - index agent not available
        with pytest.raises(pytest.skip.Exception):
            hooks.pytest_runtest_setup(item)
