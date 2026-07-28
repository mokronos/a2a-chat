"""Vercel entry point for the test agent.

Vercel serves ASGI apps from a module under `api/`, while the agent itself lives
one level up next to its dependencies. Adding the project root to `sys.path`
lets this thin module expose that same app without a second copy of it.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fast import app as app  # noqa: E402
