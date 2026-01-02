"""Unit tests for marker functionality."""

import pytest

from superclaude.markers import MarkerRegistry, MARKERS


@pytest.mark.unit
class TestMarkerRegistry:
    """Test cases for MarkerRegistry."""

    def test_init(self) -> None:
        """Test marker registry initialization."""
        registry = MarkerRegistry()
        assert registry.markers == MARKERS
        assert "unit" in registry.markers
        assert "integration" in registry.markers

    def test_get_marker_names(self) -> None:
        """Test getting marker names."""
        registry = MarkerRegistry()
        names = registry.get_marker_names()
        assert isinstance(names, list)
        assert len(names) > 0
        assert "unit" in names
        assert "integration" in names

    def test_register_markers(self, mock_pytest_config) -> None:
        """Test marker registration with pytest config."""
        registry = MarkerRegistry()
        registry.register_markers(mock_pytest_config)
        # Verify addinivalue_line was called for each marker
        assert mock_pytest_config.addinivalue_line.call_count == len(MARKERS)

    def test_validate_markers_with_valid_markers(self) -> None:
        """Test validation with valid markers."""
        registry = MarkerRegistry()
        mock_item = type("MockItem", (), {
            "nodeid": "test_file.py::test_func",
            "iter_markers": lambda self: [type("Marker", (), {"name": "unit"})()]
        })()
        items = [mock_item]
        assert registry.validate_markers(items) is True

    def test_custom_marker_exists(self) -> None:
        """Test that all expected custom markers exist."""
        expected_markers = [
            "unit",
            "integration",
            "agent_pm",
            "agent_research",
            "agent_index",
            "requires_llm",
            "slow",
        ]
        for marker in expected_markers:
            assert marker in MARKERS
