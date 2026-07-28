"""Shared-token auth for the test agent.

The agent card stays public so a client can discover *how* to authenticate; every
JSON-RPC call then has to carry the token. Without ``A2A_API_TOKEN`` the agent
runs open, which is what the local development loop wants.
"""

import os
import secrets

from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp, Receive, Scope, Send

SECURITY_SCHEME_NAME = "bearer"
PUBLIC_PATHS = frozenset({"/.well-known/agent-card.json", "/docs"})


def configured_token() -> str | None:
    token = os.environ.get("A2A_API_TOKEN", "").strip()
    return token or None


def security_schemes() -> dict[str, dict[str, object]]:
    return {
        SECURITY_SCHEME_NAME: {
            "type": "http",
            "scheme": "bearer",
            "description": "Shared token issued with this deployment.",
        }
    }


class BearerTokenMiddleware:
    """Rejects unauthenticated JSON-RPC calls with a 401 the client can act on."""

    def __init__(self, app: ASGIApp, token: str) -> None:
        self.app = app
        self.token = token

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"] in PUBLIC_PATHS:
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        header = request.headers.get("authorization", "")
        scheme, _, presented = header.partition(" ")

        if scheme.lower() != "bearer" or not secrets.compare_digest(presented.strip(), self.token):
            response: Response = JSONResponse(
                {"error": "unauthorized", "detail": "A valid bearer token is required."},
                status_code=401,
                headers={"WWW-Authenticate": 'Bearer realm="a2a"'},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)
