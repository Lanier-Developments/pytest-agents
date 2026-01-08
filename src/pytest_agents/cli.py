"""CLI commands for pytest-agents."""

import argparse  # pragma: no cover
import json  # pragma: no cover
import sys  # pragma: no cover

from pytest_agents import __version__  # pragma: no cover
from pytest_agents.agent_bridge import AgentBridge  # pragma: no cover
from pytest_agents.config import PytestAgentsConfig  # pragma: no cover
from pytest_agents.di.container import ApplicationContainer  # pragma: no cover
from pytest_agents.metrics_server import start_metrics_server  # pragma: no cover
from pytest_agents.utils.logging import setup_logger  # pragma: no cover

logger = setup_logger(__name__)


def cmd_version(args: argparse.Namespace) -> int:
    """Print version information.

    Args:
        args: Command arguments

    Returns:
        int: Exit code
    """
    print(f"pytest-agents v{__version__}")
    return 0


def cmd_verify(args: argparse.Namespace) -> int:
    """Verify installation and agent availability.

    Args:
        args: Command arguments

    Returns:
        int: Exit code
    """
    print(f"pytest-agents v{__version__}")
    print("=" * 40)

    config = PytestAgentsConfig.from_env()
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
            except Exception as e:  # pragma: no cover
                print(f"  ✗ {agent_name}: {e}")  # pragma: no cover
                all_ok = False  # pragma: no cover

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
    config = PytestAgentsConfig.from_env()
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
    config = PytestAgentsConfig.from_env()  # pragma: no cover

    # Override with CLI arguments  # pragma: no cover
    port = args.port if args.port else config.metrics_port  # pragma: no cover
    host = args.host if args.host else config.metrics_host  # pragma: no cover

    print("Starting SuperClaude metrics server")  # pragma: no cover
    print(f"Listening on http://{host}:{port}/metrics")  # pragma: no cover
    print("Press Ctrl+C to stop")  # pragma: no cover

    try:  # pragma: no cover
        # Setup DI container  # pragma: no cover
        container = ApplicationContainer()  # pragma: no cover
        container.wire(modules=["pytest_agents.cli"])  # pragma: no cover

        # Get instances from container  # pragma: no cover
        metrics = container.metrics()  # pragma: no cover
        bridge = container.agent_bridge()  # pragma: no cover

        # Start server (blocks until Ctrl+C)  # pragma: no cover
        start_metrics_server(  # pragma: no cover
            port=port,  # pragma: no cover
            host=host,  # pragma: no cover
            metrics=metrics,  # pragma: no cover
            agent_bridge=bridge,  # pragma: no cover
            block=True,  # pragma: no cover
        )  # pragma: no cover

        return 0  # pragma: no cover

    except KeyboardInterrupt:  # pragma: no cover
        print("\nShutting down...")  # pragma: no cover
        return 0  # pragma: no cover
    except Exception as e:  # pragma: no cover
        logger.exception("Error starting metrics server")  # pragma: no cover
        print(f"Error: {e}", file=sys.stderr)  # pragma: no cover
        return 1  # pragma: no cover


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
