"""Unit tests for CLI commands."""

import argparse
import json
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import pytest

from pytest_agents.cli import cmd_agent, cmd_doctor, cmd_verify, cmd_version, main


@pytest.mark.unit
class TestCLICommands:
    """Test cases for CLI command functions."""

    def test_cmd_version(self, capsys) -> None:
        """Test version command."""
        args = argparse.Namespace()
        exit_code = cmd_version(args)

        assert exit_code == 0
        captured = capsys.readouterr()
        assert "pytest-agents v" in captured.out

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_verify_success(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test verify command with successful agents."""
        # Mock config
        mock_config_instance = MagicMock()
        mock_config_instance.project_root = Path("/test")
        mock_config_instance.agent_timeout = 30
        mock_config.return_value = mock_config_instance

        # Mock bridge
        mock_bridge = MagicMock()
        mock_bridge.get_available_agents.return_value = ["pm", "research"]
        mock_bridge.invoke_agent.return_value = {"status": "success"}
        mock_bridge_class.return_value = mock_bridge

        args = argparse.Namespace()
        exit_code = cmd_verify(args)

        assert exit_code == 0
        captured = capsys.readouterr()
        assert "Available agents: pm, research" in captured.out
        assert "All checks passed!" in captured.out

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_verify_no_agents(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test verify command when no agents available."""
        # Mock config
        mock_config_instance = MagicMock()
        mock_config_instance.project_root = Path("/test")
        mock_config_instance.agent_timeout = 30
        mock_config.return_value = mock_config_instance

        # Mock bridge with no agents
        mock_bridge = MagicMock()
        mock_bridge.get_available_agents.return_value = []
        mock_bridge_class.return_value = mock_bridge

        args = argparse.Namespace()
        exit_code = cmd_verify(args)

        assert exit_code == 1
        captured = capsys.readouterr()
        assert "No agents available" in captured.out

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_verify_agent_failure(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test verify command when agent fails."""
        # Mock config
        mock_config_instance = MagicMock()
        mock_config_instance.project_root = Path("/test")
        mock_config_instance.agent_timeout = 30
        mock_config.return_value = mock_config_instance

        # Mock bridge with failing agent
        mock_bridge = MagicMock()
        mock_bridge.get_available_agents.return_value = ["pm"]
        mock_bridge.invoke_agent.return_value = {
            "status": "error",
            "data": {"error": "Agent failed"},
        }
        mock_bridge_class.return_value = mock_bridge

        args = argparse.Namespace()
        exit_code = cmd_verify(args)

        assert exit_code == 1
        captured = capsys.readouterr()
        assert "Some checks failed" in captured.out

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_verify_exception(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test verify command with exception."""
        # Mock config
        mock_config_instance = MagicMock()
        mock_config_instance.project_root = Path("/test")
        mock_config_instance.agent_timeout = 30
        mock_config.return_value = mock_config_instance

        # Make bridge raise exception
        mock_bridge_class.side_effect = Exception("Bridge error")

        args = argparse.Namespace()
        exit_code = cmd_verify(args)

        assert exit_code == 1
        captured = capsys.readouterr()
        assert "Error:" in captured.out

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_agent_success(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test agent command with successful invocation."""
        # Mock config and bridge
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        mock_bridge = MagicMock()
        mock_bridge.invoke_agent.return_value = {
            "agent": "pm",
            "status": "success",
            "data": {"result": "ok"},
        }
        mock_bridge_class.return_value = mock_bridge

        args = argparse.Namespace(name="pm", action="test", params=None, json=False)
        exit_code = cmd_agent(args)

        assert exit_code == 0
        captured = capsys.readouterr()
        assert "Agent: pm" in captured.out
        assert "Status: success" in captured.out

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_agent_with_json_output(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test agent command with JSON output."""
        # Mock config and bridge
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        mock_bridge = MagicMock()
        mock_bridge.invoke_agent.return_value = {
            "agent": "pm",
            "status": "success",
            "data": {"result": "ok"},
        }
        mock_bridge_class.return_value = mock_bridge

        args = argparse.Namespace(name="pm", action="test", params=None, json=True)
        exit_code = cmd_agent(args)

        assert exit_code == 0
        captured = capsys.readouterr()
        result = json.loads(captured.out)
        assert result["status"] == "success"

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_agent_with_params(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test agent command with JSON parameters."""
        # Mock config and bridge
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        mock_bridge = MagicMock()
        mock_bridge.invoke_agent.return_value = {
            "agent": "pm",
            "status": "success",
            "data": {},
        }
        mock_bridge_class.return_value = mock_bridge

        params_json = '{"key": "value"}'
        args = argparse.Namespace(
            name="pm", action="test", params=params_json, json=False
        )
        exit_code = cmd_agent(args)

        assert exit_code == 0
        mock_bridge.invoke_agent.assert_called_with("pm", "test", {"key": "value"})

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_agent_error(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test agent command with error response."""
        # Mock config and bridge
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        mock_bridge = MagicMock()
        mock_bridge.invoke_agent.return_value = {
            "agent": "pm",
            "status": "error",
            "data": {"error": "Failed"},
        }
        mock_bridge_class.return_value = mock_bridge

        args = argparse.Namespace(name="pm", action="test", params=None, json=False)
        exit_code = cmd_agent(args)

        assert exit_code == 1

    @patch("pytest_agents.cli.AgentBridge")
    @patch("pytest_agents.cli.PytestAgentsConfig.from_env")
    def test_cmd_agent_with_invalid_json_params(
        self, mock_config: Mock, mock_bridge_class: Mock, capsys
    ) -> None:
        """Test agent command with invalid JSON parameters."""
        # Mock config
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        mock_bridge = MagicMock()
        mock_bridge_class.return_value = mock_bridge

        args = argparse.Namespace(
            name="pm", action="test", params="not valid json", json=False
        )
        exit_code = cmd_agent(args)

        assert exit_code == 1
        captured = capsys.readouterr()
        assert "Error:" in captured.err

    @patch("pytest_agents.cli.cmd_verify")
    def test_cmd_doctor(self, mock_verify: Mock) -> None:
        """Test doctor command is alias for verify."""
        mock_verify.return_value = 0
        args = argparse.Namespace()

        exit_code = cmd_doctor(args)

        assert exit_code == 0
        mock_verify.assert_called_once_with(args)


@pytest.mark.unit
class TestCLIMain:
    """Test cases for CLI main entry point."""

    @patch("sys.argv", ["pytest_agents", "version"])
    @patch("pytest_agents.cli.cmd_version")
    def test_main_version_command(self, mock_cmd: Mock) -> None:
        """Test main with version command."""
        mock_cmd.return_value = 0

        exit_code = main()

        assert exit_code == 0
        mock_cmd.assert_called_once()

    @patch("sys.argv", ["pytest_agents", "verify"])
    @patch("pytest_agents.cli.cmd_verify")
    def test_main_verify_command(self, mock_cmd: Mock) -> None:
        """Test main with verify command."""
        mock_cmd.return_value = 0

        exit_code = main()

        assert exit_code == 0
        mock_cmd.assert_called_once()

    @patch("sys.argv", ["pytest_agents", "doctor"])
    @patch("pytest_agents.cli.cmd_doctor")
    def test_main_doctor_command(self, mock_cmd: Mock) -> None:
        """Test main with doctor command."""
        mock_cmd.return_value = 0

        exit_code = main()

        assert exit_code == 0
        mock_cmd.assert_called_once()

    @patch("sys.argv", ["pytest_agents", "agent", "pm", "test"])
    @patch("pytest_agents.cli.cmd_agent")
    def test_main_agent_command(self, mock_cmd: Mock) -> None:
        """Test main with agent command."""
        mock_cmd.return_value = 0

        exit_code = main()

        assert exit_code == 0
        mock_cmd.assert_called_once()

    @patch("sys.argv", ["pytest_agents"])
    def test_main_no_command(self, capsys) -> None:
        """Test main with no command shows help."""
        exit_code = main()

        assert exit_code == 1
