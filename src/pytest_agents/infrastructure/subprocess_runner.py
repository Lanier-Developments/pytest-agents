"""Subprocess execution implementation."""

import subprocess
from typing import Any, Dict, List


class SubprocessRunner:
    """Production subprocess execution implementing IProcessRunner protocol."""

    def run(self, cmd: List[str], input: str = "", timeout: int = 30) -> Dict[str, Any]:
        """Execute a command and return results."""
        result = subprocess.run(
            cmd,
            input=input,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        return {
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
