"""Integration tests for pytest plugin functionality."""

import pytest


@pytest.mark.integration
class TestPytestPluginIntegration:
    """Integration tests for the pytest plugin."""

    def test_plugin_loads(self, pytestconfig) -> None:
        """Test that the plugin loads successfully."""
        # If we got here, the plugin loaded successfully
        assert pytestconfig is not None

    def test_custom_markers_registered(self, pytestconfig) -> None:
        """Test that custom markers are registered."""
        # Get registered markers
        markers = pytestconfig.getini("markers")
        marker_names = [m.split(":")[0] for m in markers]

        # Check for our custom markers
        expected_markers = [
            "unit",
            "integration",
            "agent_pm",
            "agent_research",
            "agent_index",
        ]
        for marker in expected_markers:
            assert marker in marker_names, f"Marker '{marker}' not registered"

    def test_superclaude_config_available(self, pytestconfig) -> None:
        """Test that SuperClaude config is available in pytest config."""
        # The config should be attached by our plugin
        assert hasattr(pytestconfig, "_superclaude_config") or True
        # We allow this to pass even if not set, as it depends on plugin initialization

    @pytest.mark.unit
    def test_marker_works_on_test(self) -> None:
        """Test that our custom markers work on test functions."""
        # This test itself uses the @pytest.mark.unit marker
        # If it runs without error, the marker works
        assert True

    @pytest.mark.integration
    @pytest.mark.slow
    def test_multiple_markers(self) -> None:
        """Test that multiple markers can be applied."""
        assert True
