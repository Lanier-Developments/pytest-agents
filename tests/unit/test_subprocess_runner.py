"""Unit tests for SubprocessRunner."""

import subprocess
from unittest.mock import MagicMock, patch

import pytest

from pytest_agents.infrastructure.subprocess_runner import SubprocessRunner


@pytest.mark.unit
class TestSubprocessRunner:
    """Test cases for SubprocessRunner."""

    def test_initialization(self) -> None:
        """Test SubprocessRunner can be instantiated."""
        runner = SubprocessRunner()
        assert runner is not None

    @patch("subprocess.run")
    def test_run_success(self, mock_run: MagicMock) -> None:
        """Test successful command execution."""
        runner = SubprocessRunner()

        # Mock successful response
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "output"
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        result = runner.run(["echo", "test"])

        assert result["returncode"] == 0
        assert result["stdout"] == "output"
        assert result["stderr"] == ""
        mock_run.assert_called_once_with(
            ["echo", "test"],
            input="",
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )

    @patch("subprocess.run")
    def test_run_with_input(self, mock_run: MagicMock) -> None:
        """Test command execution with input."""
        runner = SubprocessRunner()

        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "processed"
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        result = runner.run(["cat"], input="test input")

        assert result["returncode"] == 0
        mock_run.assert_called_once_with(
            ["cat"],
            input="test input",
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )

    @patch("subprocess.run")
    def test_run_with_timeout(self, mock_run: MagicMock) -> None:
        """Test command execution with custom timeout."""
        runner = SubprocessRunner()

        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = ""
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        runner.run(["sleep", "1"], timeout=60)

        mock_run.assert_called_once_with(
            ["sleep", "1"],
            input="",
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )

    @patch("subprocess.run")
    def test_run_command_error(self, mock_run: MagicMock) -> None:
        """Test command execution that returns error code."""
        runner = SubprocessRunner()

        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_result.stdout = ""
        mock_result.stderr = "command not found"
        mock_run.return_value = mock_result

        result = runner.run(["nonexistent"])

        assert result["returncode"] == 1
        assert result["stderr"] == "command not found"

    @patch("subprocess.run")
    def test_run_timeout_exception(self, mock_run: MagicMock) -> None:
        """Test command execution timeout."""
        runner = SubprocessRunner()

        mock_run.side_effect = subprocess.TimeoutExpired(["sleep", "10"], 5)

        with pytest.raises(subprocess.TimeoutExpired):
            runner.run(["sleep", "10"], timeout=5)
