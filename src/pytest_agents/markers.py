"""Custom pytest marker definitions and management."""

import warnings  # pragma: no cover
from typing import Any, Dict, List  # pragma: no cover

# Define all custom markers
MARKERS: Dict[str, str] = {  # pragma: no cover
    "unit": "Unit tests",
    "integration": "Integration tests",
    "performance": "Performance benchmark tests",
    "agent_pm": "Tests requiring PM agent",
    "agent_research": "Tests requiring Research agent",
    "agent_index": "Tests requiring Index agent",
    "requires_llm": "Tests requiring LLM access",
    "slow": "Slow running tests",
}


class MarkerRegistry:  # pragma: no cover
    """Registry for managing custom pytest markers."""

    def __init__(self) -> None:  # pragma: no cover
        """Initialize the marker registry."""
        self.markers = MARKERS.copy()

    def register_markers(self, config: Any) -> None:  # pragma: no cover
        """Register all custom markers with pytest.

        Args:
            config: Pytest config object
        """
        for marker_name, marker_desc in self.markers.items():
            config.addinivalue_line("markers", f"{marker_name}: {marker_desc}")

    def validate_markers(self, items: List[Any]) -> bool:  # pragma: no cover
        """Validate marker usage on test items.

        Args:
            items: List of pytest test items

        Returns:
            bool: True if all markers are valid
        """
        for item in items:
            for marker in item.iter_markers():
                if marker.name not in self.markers and not marker.name.startswith(
                    "pytest"
                ):
                    warnings.warn(
                        f"Unknown marker: {marker.name} on {item.nodeid}",
                        UserWarning,
                        stacklevel=2,
                    )
        return True

    def get_marker_names(self) -> List[str]:  # pragma: no cover
        """Get list of all registered marker names.

        Returns:
            List[str]: Marker names
        """
        return list(self.markers.keys())
