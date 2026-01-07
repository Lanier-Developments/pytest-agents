"""Unit tests for validation utilities."""

import pytest

from pytest_agents.utils.validation import validate_agent_response, validate_json


@pytest.mark.unit
class TestValidateJson:
    """Test cases for JSON validation."""

    def test_validate_json_with_valid_json(self) -> None:
        """Test validate_json with valid JSON string."""
        json_str = '{"key": "value", "number": 42}'
        result = validate_json(json_str)

        assert result is not None
        assert isinstance(result, dict)
        assert result["key"] == "value"
        assert result["number"] == 42

    def test_validate_json_with_empty_dict(self) -> None:
        """Test validate_json with empty dict."""
        json_str = "{}"
        result = validate_json(json_str)

        assert result is not None
        assert isinstance(result, dict)
        assert len(result) == 0

    def test_validate_json_with_nested_structure(self) -> None:
        """Test validate_json with nested JSON."""
        json_str = '{"outer": {"inner": "value"}}'
        result = validate_json(json_str)

        assert result is not None
        assert "outer" in result
        assert result["outer"]["inner"] == "value"

    def test_validate_json_with_invalid_json(self) -> None:
        """Test validate_json with invalid JSON string."""
        json_str = "{invalid json"
        result = validate_json(json_str)

        assert result is None

    def test_validate_json_with_json_array(self) -> None:
        """Test validate_json with JSON array returns None."""
        json_str = '["item1", "item2"]'
        result = validate_json(json_str)

        # Should return None because it's not a dict
        assert result is None

    def test_validate_json_with_json_string(self) -> None:
        """Test validate_json with JSON string returns None."""
        json_str = '"just a string"'
        result = validate_json(json_str)

        assert result is None

    def test_validate_json_with_json_number(self) -> None:
        """Test validate_json with JSON number returns None."""
        json_str = "42"
        result = validate_json(json_str)

        assert result is None

    def test_validate_json_with_empty_string(self) -> None:
        """Test validate_json with empty string."""
        result = validate_json("")

        assert result is None

    def test_validate_json_with_none_type(self) -> None:
        """Test validate_json handles TypeError for None."""
        # This will trigger TypeError in json.loads
        result = validate_json(None)  # type: ignore

        assert result is None


@pytest.mark.unit
class TestValidateAgentResponse:
    """Test cases for agent response validation."""

    def test_validate_agent_response_with_success(self) -> None:
        """Test validation with successful response."""
        response = {"status": "success", "data": {"result": "value"}}

        assert validate_agent_response(response) is True

    def test_validate_agent_response_with_error(self) -> None:
        """Test validation with error response."""
        response = {"status": "error", "data": {"message": "error occurred"}}

        assert validate_agent_response(response) is True

    def test_validate_agent_response_with_partial(self) -> None:
        """Test validation with partial response."""
        response = {"status": "partial", "data": {"partial_result": "data"}}

        assert validate_agent_response(response) is True

    def test_validate_agent_response_missing_status(self) -> None:
        """Test validation fails without status field."""
        response = {"data": {"result": "value"}}

        assert validate_agent_response(response) is False

    def test_validate_agent_response_missing_data(self) -> None:
        """Test validation fails without data field."""
        response = {"status": "success"}

        assert validate_agent_response(response) is False

    def test_validate_agent_response_invalid_status(self) -> None:
        """Test validation fails with invalid status value."""
        response = {"status": "invalid_status", "data": {}}

        assert validate_agent_response(response) is False

    def test_validate_agent_response_not_dict(self) -> None:
        """Test validation fails with non-dict response."""
        assert validate_agent_response("not a dict") is False  # type: ignore
        assert validate_agent_response([1, 2, 3]) is False  # type: ignore
        assert validate_agent_response(None) is False  # type: ignore

    def test_validate_agent_response_empty_dict(self) -> None:
        """Test validation fails with empty dict."""
        assert validate_agent_response({}) is False

    def test_validate_agent_response_with_extra_fields(self) -> None:
        """Test validation succeeds with extra fields."""
        response = {
            "status": "success",
            "data": {"result": "value"},
            "metadata": {"timestamp": "2024-01-01"},
            "extra": "field",
        }

        assert validate_agent_response(response) is True

    def test_validate_agent_response_empty_data(self) -> None:
        """Test validation succeeds with empty data dict."""
        response = {"status": "success", "data": {}}

        assert validate_agent_response(response) is True

    def test_validate_agent_response_data_null(self) -> None:
        """Test validation succeeds with null data."""
        response = {"status": "success", "data": None}

        assert validate_agent_response(response) is True
