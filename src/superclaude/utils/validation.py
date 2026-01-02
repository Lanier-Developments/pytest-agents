"""Validation utilities for SuperClaude."""

import json
from typing import Any, Dict, Optional


def validate_json(data: str) -> Optional[Dict[str, Any]]:
    """Validate and parse JSON string.

    Args:
        data: JSON string to validate

    Returns:
        Optional[Dict[str, Any]]: Parsed JSON dict or None if invalid
    """
    try:
        parsed = json.loads(data)
        if isinstance(parsed, dict):
            return parsed
        return None
    except (json.JSONDecodeError, TypeError):
        return None


def validate_agent_response(response: Dict[str, Any]) -> bool:
    """Validate agent response structure.

    Args:
        response: Agent response dictionary

    Returns:
        bool: True if response is valid
    """
    required_fields = ["status", "data"]

    if not isinstance(response, dict):
        return False

    for field in required_fields:
        if field not in response:
            return False

    if response["status"] not in ["success", "error", "partial"]:
        return False

    return True
