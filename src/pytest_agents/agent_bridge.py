"""Bridge between Python pytest and TypeScript agents."""

import json
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, Optional, Protocol

from pytest_agents.config import SuperClaudeConfig
from pytest_agents.utils.logging import setup_logger
from pytest_agents.utils.validation import validate_agent_response, validate_json

logger = setup_logger(__name__)


class IProcessRunner(Protocol):
    """Protocol for process execution."""

    def run(
        self, cmd: list[str], input: str = "", timeout: int = 30
    ) -> Dict[str, Any]: ...


class AgentClient:
    """Client for communicating with a single agent."""

    def __init__(
        self,
        name: str,
        agent_path: Path,
        process_runner: Optional[IProcessRunner] = None,
        timeout: int = 30,
    ) -> None:
        """Initialize agent client.

        Args:
            name: Agent name (pm, research, index)
            agent_path: Path to agent's index.js file
            process_runner: Optional process runner (defaults to subprocess)
            timeout: Command timeout in seconds
        """
        self.name = name
        self.agent_path = agent_path
        self.timeout = timeout
        self._process_runner = process_runner

    def invoke(
        self, action: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Invoke agent with specified action and parameters.

        Args:
            action: Action to perform
            params: Optional parameters for the action

        Returns:
            Dict[str, Any]: Agent response

        Raises:
            RuntimeError: If agent execution fails
        """
        if params is None:
            params = {}

        if not self.agent_path.exists():
            raise RuntimeError(
                f"Agent {self.name} not found at {self.agent_path}. "
                f"Run 'make install' to build agents."
            )

        request = {"action": action, "params": params}
        request_json = json.dumps(request)

        logger.debug(f"Invoking {self.name} agent: {action}")

        try:
            # Use injected process runner or fallback to subprocess
            # for backwards compatibility
            if self._process_runner:
                result_dict = self._process_runner.run(
                    ["node", str(self.agent_path)],
                    input=request_json,
                    timeout=self.timeout,
                )

                # Create a result object compatible with subprocess.CompletedProcess
                class Result:
                    def __init__(self, d):
                        self.returncode = d["returncode"]
                        self.stdout = d["stdout"]
                        self.stderr = d["stderr"]

                result = Result(result_dict)
            else:
                result = subprocess.run(
                    ["node", str(self.agent_path)],
                    input=request_json,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                    check=False,
                )

            if result.returncode != 0:
                error_msg = result.stderr or result.stdout or "Unknown error"
                logger.error(f"Agent {self.name} failed: {error_msg}")
                return {
                    "status": "error",
                    "data": {"error": error_msg},
                    "agent": self.name,
                }

            response_data = validate_json(result.stdout)
            if response_data is None:
                logger.error(f"Invalid JSON response from {self.name}: {result.stdout}")
                return {
                    "status": "error",
                    "data": {"error": "Invalid JSON response", "raw": result.stdout},
                    "agent": self.name,
                }

            if not validate_agent_response(response_data):
                logger.warning(f"Invalid response structure from {self.name}")
                # Wrap response in valid structure
                return {
                    "status": "success",
                    "data": response_data,
                    "agent": self.name,
                }

            response_data["agent"] = self.name
            logger.debug(f"Agent {self.name} response: {response_data['status']}")
            return response_data

        except subprocess.TimeoutExpired:
            logger.error(f"Agent {self.name} timed out after {self.timeout}s")
            return {
                "status": "error",
                "data": {"error": f"Timeout after {self.timeout}s"},
                "agent": self.name,
            }
        except Exception as e:
            logger.exception(f"Error invoking {self.name} agent")
            return {
                "status": "error",
                "data": {"error": str(e)},
                "agent": self.name,
            }


class AgentBridge:
    """Bridge between Python pytest and TypeScript agents."""

    def __init__(
        self,
        config: Optional[SuperClaudeConfig] = None,
        client_factory: Optional[Any] = None,
        process_runner: Optional[IProcessRunner] = None,
        metrics: Optional[Any] = None,
    ) -> None:
        """Initialize agent bridge.

        Args:
            config: Optional configuration, defaults to environment config
            client_factory: Optional factory for creating AgentClient instances
            process_runner: Optional process runner for direct client creation
            metrics: Optional metrics collector
        """
        self.config = config or SuperClaudeConfig.from_env()
        self.agents: Dict[str, AgentClient] = {}
        self._client_factory = client_factory
        self._process_runner = process_runner
        self._metrics = metrics

        # Initialize enabled agents
        if self.config.agent_pm_enabled and self.config.agent_pm_path:
            self.agents["pm"] = self._create_client(
                "pm", self.config.agent_pm_path, self.config.agent_timeout
            )

        if self.config.agent_research_enabled and self.config.agent_research_path:
            self.agents["research"] = self._create_client(
                "research",
                self.config.agent_research_path,
                self.config.agent_timeout,
            )

        if self.config.agent_index_enabled and self.config.agent_index_path:
            self.agents["index"] = self._create_client(
                "index", self.config.agent_index_path, self.config.agent_timeout
            )

        # Track initialized agents count
        if self._metrics:
            self._metrics.set_gauge(
                "pytest_agents_bridge_initialized_agents_total", len(self.agents)
            )

        logger.info(f"Initialized bridge with agents: {list(self.agents.keys())}")

    def _create_client(self, name: str, path: Path, timeout: int) -> AgentClient:
        """Create an AgentClient using factory or direct instantiation.

        Args:
            name: Agent name
            path: Agent path
            timeout: Timeout in seconds

        Returns:
            AgentClient: Created client instance
        """
        if self._client_factory:
            return self._client_factory(name=name, agent_path=path, timeout=timeout)
        else:
            return AgentClient(
                name=name,
                agent_path=path,
                process_runner=self._process_runner,
                timeout=timeout,
            )

    def invoke_agent(
        self, agent_name: str, action: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Invoke a TypeScript agent via subprocess.

        Args:
            agent_name: Name of agent to invoke (pm, research, index)
            action: Action to perform
            params: Optional parameters for the action

        Returns:
            Dict[str, Any]: Agent response

        Raises:
            ValueError: If agent is not available
        """
        if agent_name not in self.agents:
            available = ", ".join(self.agents.keys())
            raise ValueError(
                f"Agent '{agent_name}' not available. Available agents: {available}"
            )

        # Track total invocations
        if self._metrics:
            self._metrics.increment_counter(
                "pytest_agents_agent_invocations_total",
                {"agent": agent_name, "action": action},
            )

        # Track invocation duration
        start_time = time.time()
        try:
            response = self.agents[agent_name].invoke(action, params)

            # Track success/error
            if self._metrics:
                duration = time.time() - start_time
                self._metrics.observe_histogram(
                    "pytest_agents_agent_invocation_duration_seconds",
                    duration,
                    {"agent": agent_name, "action": action},
                )

                if response.get("status") == "success":
                    self._metrics.increment_counter(
                        "pytest_agents_agent_invocations_success_total",
                        {"agent": agent_name, "action": action},
                    )
                else:
                    self._metrics.increment_counter(
                        "pytest_agents_agent_invocations_error_total",
                        {"agent": agent_name, "action": action},
                    )

            return response
        except Exception:
            # Track error
            if self._metrics:
                duration = time.time() - start_time
                self._metrics.observe_histogram(
                    "pytest_agents_agent_invocation_duration_seconds",
                    duration,
                    {"agent": agent_name, "action": action},
                )
                self._metrics.increment_counter(
                    "pytest_agents_agent_invocations_error_total",
                    {"agent": agent_name, "action": action},
                )
            raise

    def get_available_agents(self) -> list[str]:
        """Get list of available agent names.

        Returns:
            list[str]: List of agent names
        """
        return list(self.agents.keys())

    def is_agent_available(self, agent_name: str) -> bool:
        """Check if an agent is available.

        Args:
            agent_name: Agent name to check

        Returns:
            bool: True if agent is available
        """
        return agent_name in self.agents
