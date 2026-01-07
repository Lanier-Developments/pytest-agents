"""CLI commands for pytest-agents."""

import argparse
import json
import sys

from pytest_agents import __version__
from pytest_agents.agent_bridge import AgentBridge
from pytest_agents.config import SuperClaudeConfig
from pytest_agents.di.container import ApplicationContainer
from pytest_agents.metrics_server import start_metrics_server
from pytest_agents.utils.logging import setup_logger

logger = setup_logger(__name__)


def cmd_version(args: argparse.Namespace) -> int:
    """Print version information.

    Args:
        args: Command arguments

    Returns:
        int: Exit code
    """
    print(f"SuperClaude v{__version__}")
    return 0


def cmd_verify(args: argparse.Namespace) -> int:
    """Verify installation and agent availability.

    Args:
        args: Command arguments

    Returns:
        int: Exit code
    """
    print(f"SuperClaude v{__version__}")
    print("=" * 40)

    config = SuperClaudeConfig.from_env()
    print(f"\nProject root: {config.project_root}")
    print(f"Agent timeout: {config.agent_timeout}s")

    try:
        bridge = AgentBridge(config)
        available = bridge.get_available_agents()

        if available:
            print(f"\nAvailable agents: {', '.join(available)}")
        else:
            print("\nNo agents available")
            print("Run 'make install' to build agents")
            return 1

        # Test each agent
        print("\nTesting agents...")
        all_ok = True
        for agent_name in available:
            try:
                result = bridge.invoke_agent(agent_name, "ping", {})
                if result.get("status") == "success":
                    print(f"  ✓ {agent_name}")
                else:
                    error = result.get("data", {}).get("error", "Unknown error")
                    print(f"  ✗ {agent_name}: {error}")
                    all_ok = False
            except Exception as e:
                print(f"  ✗ {agent_name}: {e}")
                all_ok = False

        if all_ok:
            print("\nAll checks passed!")
            return 0
        else:
            print("\nSome checks failed")
            return 1

    except Exception as e:
        print(f"\nError: {e}")
        return 1


def cmd_agent(args: argparse.Namespace) -> int:
    """Invoke an agent from command line.

    Args:
        args: Command arguments

    Returns:
        int: Exit code
    """
    config = SuperClaudeConfig.from_env()
    bridge = AgentBridge(config)

    try:
        params = json.loads(args.params) if args.params else {}
        result = bridge.invoke_agent(args.name, args.action, params)

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Agent: {result.get('agent', args.name)}")
            print(f"Status: {result.get('status', 'unknown')}")
            print(f"Data: {json.dumps(result.get('data', {}), indent=2)}")

        return 0 if result.get("status") == "success" else 1

    except Exception as e:
        logger.exception("Error invoking agent")
        print(f"Error: {e}", file=sys.stderr)
        return 1


def cmd_doctor(args: argparse.Namespace) -> int:
    """Run diagnostic checks (alias for verify).

    Args:
        args: Command arguments

    Returns:
        int: Exit code
    """
    return cmd_verify(args)


def cmd_metrics(args: argparse.Namespace) -> int:
    """Start the metrics HTTP server.

    Args:
        args: Command arguments

    Returns:
        int: Exit code
    """
    config = SuperClaudeConfig.from_env()

    # Override with CLI arguments
    port = args.port if args.port else config.metrics_port
    host = args.host if args.host else config.metrics_host

    print("Starting SuperClaude metrics server")
    print(f"Listening on http://{host}:{port}/metrics")
    print("Press Ctrl+C to stop")

    try:
        # Setup DI container
        container = ApplicationContainer()
        container.wire(modules=["pytest_agents.cli"])

        # Get instances from container
        metrics = container.metrics()
        bridge = container.agent_bridge()

        # Start server (blocks until Ctrl+C)
        start_metrics_server(
            port=port,
            host=host,
            metrics=metrics,
            agent_bridge=bridge,
            block=True,
        )

        return 0

    except KeyboardInterrupt:
        print("\nShutting down...")
        return 0
    except Exception as e:
        logger.exception("Error starting metrics server")
        print(f"Error: {e}", file=sys.stderr)
        return 1


def main() -> int:
    """Main CLI entry point.

    Returns:
        int: Exit code
    """
    parser = argparse.ArgumentParser(
        description="SuperClaude - Pytest plugin framework with AI agents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--version", action="version", version=f"SuperClaude v{__version__}"
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Version command
    subparsers.add_parser("version", help="Show version information")

    # Verify command
    subparsers.add_parser("verify", help="Verify installation and agents")

    # Doctor command
    subparsers.add_parser("doctor", help="Run diagnostic checks")

    # Agent command
    agent_parser = subparsers.add_parser("agent", help="Invoke an agent")
    agent_parser.add_argument(
        "name", choices=["pm", "research", "index"], help="Agent name"
    )
    agent_parser.add_argument("action", help="Action to perform")
    agent_parser.add_argument("--params", help="JSON parameters for the action")
    agent_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # Metrics command
    metrics_parser = subparsers.add_parser("metrics", help="Start metrics HTTP server")
    metrics_parser.add_argument(
        "--port", type=int, help="Port to listen on (default: 9090)"
    )
    metrics_parser.add_argument("--host", help="Host to bind to (default: 0.0.0.0)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    commands = {
        "version": cmd_version,
        "verify": cmd_verify,
        "doctor": cmd_doctor,
        "agent": cmd_agent,
        "metrics": cmd_metrics,
    }

    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
