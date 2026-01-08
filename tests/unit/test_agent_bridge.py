"""Unit tests for agent bridge functionality."""

import subprocess
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import pytest

from pytest_agents.agent_bridge import AgentBridge, AgentClient
from pytest_agents.config import PytestAgentsConfig


@pytest.mark.unit
class TestAgentClient:
    """Test cases for AgentClient."""

    def test_initialization(self, temp_project_dir: Path) -> None:
        """Test agent client initialization."""
        agent_path = temp_project_dir / "agent.js"
        client = AgentClient("test_agent", agent_path, timeout=60)

        assert client.name == "test_agent"
        assert client.agent_path == agent_path
        assert client.timeout == 60

    def test_invoke_agent_not_found(self, temp_project_dir: Path) -> None:
        """Test invoke when agent file doesn't exist."""
        agent_path = temp_project_dir / "nonexistent.js"
        client = AgentClient("test", agent_path)

        with pytest.raises(RuntimeError, match="Agent test not found"):
            client.invoke("test_action")

    @patch("subprocess.run")
    def test_invoke_success(self, mock_run: Mock, temp_project_dir: Path) -> None:
        """Test successful agent invocation."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()
        client = AgentClient("test", agent_path)

        # Mock successful response
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = '{"status": "success", "data": {"result": "ok"}}'
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        response = client.invoke("test_action", {"param": "value"})

        assert response["status"] == "success"
        assert response["data"]["result"] == "ok"
        assert response["agent"] == "test"
        mock_run.assert_called_once()

    @patch("subprocess.run")
    def test_invoke_subprocess_error(
        self, mock_run: Mock, temp_project_dir: Path
    ) -> None:
        """Test invoke when subprocess returns error."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()
        client = AgentClient("test", agent_path)

        # Mock error response
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_result.stdout = ""
        mock_result.stderr = "Agent error occurred"
        mock_run.return_value = mock_result

        response = client.invoke("test_action")

        assert response["status"] == "error"
        assert "Agent error occurred" in response["data"]["error"]
        assert response["agent"] == "test"

    @patch("subprocess.run")
    def test_invoke_timeout(self, mock_run: Mock, temp_project_dir: Path) -> None:
        """Test invoke when agent times out."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()
        client = AgentClient("test", agent_path, timeout=5)

        mock_run.side_effect = subprocess.TimeoutExpired("node", 5)

        response = client.invoke("test_action")

        assert response["status"] == "error"
        assert "Timeout" in response["data"]["error"]
        assert response["agent"] == "test"

    @patch("subprocess.run")
    def test_invoke_invalid_json(self, mock_run: Mock, temp_project_dir: Path) -> None:
        """Test invoke when agent returns invalid JSON."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()
        client = AgentClient("test", agent_path)

        # Mock invalid JSON response
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "not valid json"
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        response = client.invoke("test_action")

        assert response["status"] == "error"
        assert "Invalid JSON response" in response["data"]["error"]
        assert response["agent"] == "test"

    @patch("subprocess.run")
    def test_invoke_invalid_response_structure(
        self, mock_run: Mock, temp_project_dir: Path
    ) -> None:
        """Test invoke when agent returns invalid response structure."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()
        client = AgentClient("test", agent_path)

        # Mock response with invalid structure (missing required fields)
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = '{"result": "something"}'
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        response = client.invoke("test_action")

        # Should wrap in valid structure
        assert response["status"] == "success"
        assert response["data"]["result"] == "something"
        assert response["agent"] == "test"

    @patch("subprocess.run")
    def test_invoke_generic_exception(
        self, mock_run: Mock, temp_project_dir: Path
    ) -> None:
        """Test invoke when generic exception occurs."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()
        client = AgentClient("test", agent_path)

        mock_run.side_effect = Exception("Unexpected error")

        response = client.invoke("test_action")

        assert response["status"] == "error"
        assert "Unexpected error" in response["data"]["error"]
        assert response["agent"] == "test"


@pytest.mark.unit
class TestAgentBridge:
    """Test cases for AgentBridge."""

    def test_initialization_with_config(self, temp_project_dir: Path) -> None:
        """Test bridge initialization with custom config."""
        config = PytestAgentsConfig(
            project_root=temp_project_dir,
            agent_pm_enabled=True,
            agent_research_enabled=False,
            agent_index_enabled=True,
        )

        bridge = AgentBridge(config)

        assert bridge.config == config
        assert "pm" in bridge.agents
        assert "research" not in bridge.agents
        assert "index" in bridge.agents

    def test_initialization_without_config(self) -> None:
        """Test bridge initialization without config (uses env)."""
        bridge = AgentBridge()

        assert bridge.config is not None
        assert isinstance(bridge.config, PytestAgentsConfig)

    def test_get_available_agents(self, temp_project_dir: Path) -> None:
        """Test getting available agents."""
        config = PytestAgentsConfig(
            project_root=temp_project_dir,
            agent_pm_enabled=True,
            agent_research_enabled=True,
            agent_index_enabled=False,
        )

        bridge = AgentBridge(config)
        available = bridge.get_available_agents()

        assert "pm" in available
        assert "research" in available
        assert "index" not in available

    def test_is_agent_available(self, temp_project_dir: Path) -> None:
        """Test checking if agent is available."""
        config = PytestAgentsConfig(
            project_root=temp_project_dir, agent_pm_enabled=True
        )

        bridge = AgentBridge(config)

        assert bridge.is_agent_available("pm") is True
        assert bridge.is_agent_available("nonexistent") is False

    @patch("subprocess.run")
    def test_invoke_agent_success(self, mock_run: Mock, temp_project_dir: Path) -> None:
        """Test successful agent invocation through bridge."""
        # Create agent file
        pm_path = temp_project_dir / "pm" / "dist" / "index.js"
        pm_path.parent.mkdir(parents=True, exist_ok=True)
        pm_path.touch()

        config = PytestAgentsConfig(
            project_root=temp_project_dir, agent_pm_enabled=True
        )
        bridge = AgentBridge(config)

        # Mock successful response
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = '{"status": "success", "data": {"tasks": []}}'
        mock_result.stderr = ""
        mock_run.return_value = mock_result

        response = bridge.invoke_agent("pm", "list_tasks")

        assert response["status"] == "success"
        assert response["agent"] == "pm"

    def test_invoke_agent_not_available(self, temp_project_dir: Path) -> None:
        """Test invoking unavailable agent raises error."""
        config = PytestAgentsConfig(
            project_root=temp_project_dir, agent_pm_enabled=True
        )
        bridge = AgentBridge(config)

        with pytest.raises(ValueError, match="Agent 'nonexistent' not available"):
            bridge.invoke_agent("nonexistent", "test_action")

    def test_initialization_with_disabled_agents(self, temp_project_dir: Path) -> None:
        """Test initialization with all agents disabled."""
        config = PytestAgentsConfig(
            project_root=temp_project_dir,
            agent_pm_enabled=False,
            agent_research_enabled=False,
            agent_index_enabled=False,
        )

        bridge = AgentBridge(config)

        assert len(bridge.agents) == 0
        assert bridge.get_available_agents() == []


@pytest.mark.unit
class TestAgentClientWithDI:
    """Test AgentClient with dependency injection."""

    def test_invoke_with_injected_process_runner_success(
        self, temp_project_dir: Path
    ) -> None:
        """Test agent invocation with injected process runner (DI path)."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()

        # Create mock process runner
        mock_runner = MagicMock()
        mock_runner.run.return_value = {
            "returncode": 0,
            "stdout": '{"status": "success", "data": {"result": "via DI"}}',
            "stderr": "",
        }

        # Create client with injected runner
        client = AgentClient("test", agent_path, process_runner=mock_runner)
        response = client.invoke("test_action", {"param": "value"})

        # Verify DI path was used
        assert response["status"] == "success"
        assert response["data"]["result"] == "via DI"
        assert response["agent"] == "test"

        # Verify process runner was called correctly
        mock_runner.run.assert_called_once()
        call_args = mock_runner.run.call_args
        assert call_args[0][0] == ["node", str(agent_path)]
        assert "test_action" in call_args[1]["input"]

    def test_invoke_with_injected_process_runner_error(
        self, temp_project_dir: Path
    ) -> None:
        """Test agent invocation with injected process runner returning error."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()

        # Create mock process runner that returns error
        mock_runner = MagicMock()
        mock_runner.run.return_value = {
            "returncode": 1,
            "stdout": "",
            "stderr": "Error from injected runner",
        }

        client = AgentClient("test", agent_path, process_runner=mock_runner)
        response = client.invoke("test_action")

        assert response["status"] == "error"
        assert "Error from injected runner" in response["data"]["error"]
        mock_runner.run.assert_called_once()

    def test_invoke_with_injected_process_runner_timeout(
        self, temp_project_dir: Path
    ) -> None:
        """Test timeout handling with injected process runner."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()

        # Create mock process runner that raises timeout
        mock_runner = MagicMock()
        mock_runner.run.side_effect = subprocess.TimeoutExpired("node", 5)

        client = AgentClient("test", agent_path, process_runner=mock_runner, timeout=5)
        response = client.invoke("test_action")

        assert response["status"] == "error"
        assert "Timeout" in response["data"]["error"]
        mock_runner.run.assert_called_once()

    def test_invoke_with_injected_process_runner_invalid_json(
        self, temp_project_dir: Path
    ) -> None:
        """Test invalid JSON handling with injected process runner."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()

        # Create mock process runner returning invalid JSON
        mock_runner = MagicMock()
        mock_runner.run.return_value = {
            "returncode": 0,
            "stdout": "not valid json",
            "stderr": "",
        }

        client = AgentClient("test", agent_path, process_runner=mock_runner)
        response = client.invoke("test_action")

        assert response["status"] == "error"
        assert "Invalid JSON response" in response["data"]["error"]

    def test_invoke_with_injected_process_runner_exception(
        self, temp_project_dir: Path
    ) -> None:
        """Test exception handling with injected process runner."""
        agent_path = temp_project_dir / "agent.js"
        agent_path.touch()

        # Create mock process runner that raises exception
        mock_runner = MagicMock()
        mock_runner.run.side_effect = Exception("DI runner exception")

        client = AgentClient("test", agent_path, process_runner=mock_runner)
        response = client.invoke("test_action")

        assert response["status"] == "error"
        assert "DI runner exception" in response["data"]["error"]


@pytest.mark.unit
class TestAgentBridgeWithDI:
    """Test AgentBridge with dependency injection."""

    def test_bridge_with_injected_process_runner(self, temp_project_dir: Path) -> None:
        """Test bridge initialization with injected process runner."""
        # Create agent file
        pm_path = temp_project_dir / "pm" / "dist" / "index.js"
        pm_path.parent.mkdir(parents=True, exist_ok=True)
        pm_path.touch()

        # Create mock process runner
        mock_runner = MagicMock()
        mock_runner.run.return_value = {
            "returncode": 0,
            "stdout": '{"status": "success", "data": {"result": "DI bridge"}}',
            "stderr": "",
        }

        config = PytestAgentsConfig(
            project_root=temp_project_dir, agent_pm_enabled=True
        )

        # Create bridge with injected runner
        bridge = AgentBridge(config, process_runner=mock_runner)
        response = bridge.invoke_agent("pm", "test_action")

        assert response["status"] == "success"
        assert response["data"]["result"] == "DI bridge"
        mock_runner.run.assert_called_once()

    def test_bridge_with_client_factory(self, temp_project_dir: Path) -> None:
        """Test bridge with custom client factory (DI pattern)."""
        pm_path = temp_project_dir / "pm" / "dist" / "index.js"
        pm_path.parent.mkdir(parents=True, exist_ok=True)
        pm_path.touch()

        # Create mock client factory
        mock_client = MagicMock()
        mock_client.invoke.return_value = {
            "status": "success",
            "data": {"result": "factory client"},
            "agent": "pm",
        }

        def mock_factory(name, agent_path, timeout=30, process_runner=None):
            return mock_client

        config = PytestAgentsConfig(
            project_root=temp_project_dir, agent_pm_enabled=True
        )

        bridge = AgentBridge(config, client_factory=mock_factory)
        response = bridge.invoke_agent("pm", "test_action")

        assert response["status"] == "success"
        assert response["data"]["result"] == "factory client"
        mock_client.invoke.assert_called_once_with("test_action", None)
