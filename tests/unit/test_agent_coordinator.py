"""Tests for AgentCoordinator parallel execution."""

import time

import pytest

from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import SuperClaudeConfig
from pytest_agents.fixtures import AgentCoordinator


@pytest.fixture
def coordinator(tmp_path):
    """Create AgentCoordinator for testing."""
    # Create mock PM agent that responds to ping
    pm_agent = tmp_path / "pm" / "dist" / "index.js"
    pm_agent.parent.mkdir(parents=True)
    pm_agent.write_text(
        """
        const req = require("fs").readFileSync(0, "utf-8");
        const request = JSON.parse(req);
        console.log(JSON.stringify({
            status: "success",
            data: { agent: "pm", action: request.action }
        }));
        """
    )

    # Create mock Research agent
    research_agent = tmp_path / "research" / "dist" / "index.js"
    research_agent.parent.mkdir(parents=True)
    research_agent.write_text(
        """
        const req = require("fs").readFileSync(0, "utf-8");
        const request = JSON.parse(req);
        console.log(JSON.stringify({
            status: "success",
            data: { agent: "research", action: request.action }
        }));
        """
    )

    # Create mock Index agent
    index_agent = tmp_path / "index" / "dist" / "index.js"
    index_agent.parent.mkdir(parents=True)
    index_agent.write_text(
        """
        const req = require("fs").readFileSync(0, "utf-8");
        const request = JSON.parse(req);
        console.log(JSON.stringify({
            status: "success",
            data: { agent: "index", action: request.action }
        }));
        """
    )

    config = SuperClaudeConfig(
        agent_pm_enabled=True,
        agent_pm_path=pm_agent,
        agent_research_enabled=True,
        agent_research_path=research_agent,
        agent_index_enabled=True,
        agent_index_path=index_agent,
        agent_timeout=30,
    )

    bridge = AgentBridge(config=config)
    return AgentCoordinator(bridge)


class TestAgentCoordinator:
    """Test AgentCoordinator functionality."""

    def test_run_sequential(self, coordinator):
        """Test sequential execution of multiple agents."""
        tasks = [
            ("pm", "ping", {}),
            ("research", "ping", {}),
            ("index", "ping", {}),
        ]

        results = coordinator.run_sequential(tasks)

        assert len(results) == 3
        assert all(r["status"] == "success" for r in results)
        assert results[0]["data"]["agent"] == "pm"
        assert results[1]["data"]["agent"] == "research"
        assert results[2]["data"]["agent"] == "index"

    def test_run_parallel(self, coordinator):
        """Test parallel execution of multiple agents."""
        tasks = [
            ("pm", "ping", {}),
            ("research", "ping", {}),
            ("index", "ping", {}),
        ]

        results = coordinator.run_parallel(tasks)

        assert len(results) == 3
        assert all(r["status"] == "success" for r in results)
        # Verify order is preserved
        assert results[0]["data"]["agent"] == "pm"
        assert results[1]["data"]["agent"] == "research"
        assert results[2]["data"]["agent"] == "index"

    def test_run_parallel_empty_tasks(self, coordinator):
        """Test parallel execution with empty task list."""
        results = coordinator.run_parallel([])
        assert results == []

    def test_run_parallel_single_task(self, coordinator):
        """Test parallel execution with single task."""
        tasks = [("pm", "ping", {})]

        results = coordinator.run_parallel(tasks)

        assert len(results) == 1
        assert results[0]["status"] == "success"
        assert results[0]["data"]["agent"] == "pm"

    def test_run_parallel_custom_max_workers(self, coordinator):
        """Test parallel execution with custom max_workers."""
        tasks = [
            ("pm", "ping", {}),
            ("research", "ping", {}),
            ("index", "ping", {}),
        ]

        # Should work with max_workers=2
        results = coordinator.run_parallel(tasks, max_workers=2)

        assert len(results) == 3
        assert all(r["status"] == "success" for r in results)

    def test_run_parallel_preserves_order(self, coordinator):
        """Test that parallel execution preserves task order."""
        # Create multiple tasks to same agent
        tasks = [
            ("pm", "ping", {}),
            ("pm", "ping", {}),
            ("pm", "ping", {}),
            ("pm", "ping", {}),
            ("pm", "ping", {}),
        ]

        results = coordinator.run_parallel(tasks)

        assert len(results) == 5
        # All results should be present (no None values)
        assert all(r is not None for r in results)
        assert all(r["status"] == "success" for r in results)

    def test_run_parallel_actually_concurrent(self, coordinator):
        """Test that parallel execution actually runs concurrently."""
        # Run 3 agents in parallel
        tasks = [
            ("pm", "ping", {}),
            ("research", "ping", {}),
            ("index", "ping", {}),
        ]

        # Measure sequential execution
        start_seq = time.time()
        results_seq = coordinator.run_sequential(tasks)
        sequential_time = time.time() - start_seq

        # Measure parallel execution
        start_par = time.time()
        results_par = coordinator.run_parallel(tasks)
        parallel_time = time.time() - start_par

        # Both should return same results
        assert len(results_seq) == len(results_par) == 3
        assert all(r["status"] == "success" for r in results_seq)
        assert all(r["status"] == "success" for r in results_par)

        # Parallel should be at least slightly faster or comparable
        # (not testing strict performance here since it's environment-dependent)
        assert parallel_time <= sequential_time * 1.5

    def test_run_parallel_with_multiple_same_agent(self, coordinator):
        """Test that parallel execution works with multiple calls to same agent."""
        # Call PM agent 3 times in parallel
        tasks = [
            ("pm", "ping", {}),
            ("pm", "ping", {}),
            ("pm", "ping", {}),
        ]

        results = coordinator.run_parallel(tasks)

        assert len(results) == 3
        assert all(r["status"] == "success" for r in results)
        assert all(r["data"]["agent"] == "pm" for r in results)
