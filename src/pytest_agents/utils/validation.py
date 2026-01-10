"""Validation utilities for pytest-agents."""

import json  # pragma: no cover
import logging  # pragma: no cover
from typing import Any, Dict, Optional  # pragma: no cover

logger = logging.getLogger(__name__)  # pragma: no cover


def validate_json(data: str) -> Optional[Dict[str, Any]]:  # pragma: no cover
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
        logger.warning(
            "JSON validation failed: expected dict, got %s",
            type(parsed).__name__,
        )
        return None
    except json.JSONDecodeError as e:
        logger.warning("JSON validation failed: %s (position %d)", e.msg, e.pos)
        return None
    except TypeError as e:
        logger.warning("JSON validation failed: %s", str(e))
        return None


def validate_agent_response(response: Dict[str, Any]) -> bool:  # pragma: no cover
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
