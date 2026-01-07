"""Unit tests for marker functionality."""

import pytest

from pytest_agents.markers import MARKERS, MarkerRegistry


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
        mock_item = type(
            "MockItem",
            (),
            {
                "nodeid": "test_file.py::test_func",
                "iter_markers": lambda self: [type("Marker", (), {"name": "unit"})()],
            },
        )()
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

    def test_validate_markers_with_unknown_marker(self) -> None:
        """Test validation warns about unknown markers."""
        registry = MarkerRegistry()
        mock_item = type(
            "MockItem",
            (),
            {
                "nodeid": "test_file.py::test_func",
                "iter_markers": lambda self: [
                    type("Marker", (), {"name": "unknown_marker"})()
                ],
            },
        )()
        items = [mock_item]

        with pytest.warns(UserWarning, match="Unknown marker: unknown_marker"):
            assert registry.validate_markers(items) is True

    def test_validate_markers_ignores_pytest_markers(self) -> None:
        """Test validation ignores pytest builtin markers."""
        registry = MarkerRegistry()
        mock_item = type(
            "MockItem",
            (),
            {
                "nodeid": "test_file.py::test_func",
                "iter_markers": lambda self: [
                    type("Marker", (), {"name": "pytest_asyncio"})()
                ],
            },
        )()
        items = [mock_item]

        # Should not warn about pytest markers
        assert registry.validate_markers(items) is True

    def test_validate_markers_with_empty_items(self) -> None:
        """Test validation with empty items list."""
        registry = MarkerRegistry()
        assert registry.validate_markers([]) is True

    def test_validate_markers_with_multiple_markers(self) -> None:
        """Test validation with items having multiple markers."""
        registry = MarkerRegistry()
        mock_item = type(
            "MockItem",
            (),
            {
                "nodeid": "test_file.py::test_func",
                "iter_markers": lambda self: [
                    type("Marker", (), {"name": "unit"})(),
                    type("Marker", (), {"name": "slow"})(),
                    type("Marker", (), {"name": "pytest_timeout"})(),
                ],
            },
        )()
        items = [mock_item]

        assert registry.validate_markers(items) is True

    def test_marker_descriptions(self) -> None:
        """Test that all markers have descriptions."""
        for marker_name, description in MARKERS.items():
            assert isinstance(marker_name, str)
            assert isinstance(description, str)
            assert len(description) > 0

    def test_markers_are_lowercase(self) -> None:
        """Test that marker names follow lowercase convention."""
        for marker_name in MARKERS.keys():
            # Allow underscores but ensure lowercase
            assert marker_name.islower() or "_" in marker_name
            assert marker_name == marker_name.lower()

    def test_get_marker_names_returns_copy(self) -> None:
        """Test that get_marker_names returns a new list."""
        registry = MarkerRegistry()
        names1 = registry.get_marker_names()
        names2 = registry.get_marker_names()

        # Should be equal but not the same object
        assert names1 == names2
        assert names1 is not names2

    def test_markers_copy_on_init(self) -> None:
        """Test that registry creates copy of MARKERS."""
        registry = MarkerRegistry()
        registry.markers["new_marker"] = "Test"

        # Original MARKERS should not be modified
        assert "new_marker" not in MARKERS
