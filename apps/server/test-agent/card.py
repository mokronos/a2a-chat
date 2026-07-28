"""Agent card that advertises how to authenticate.

``FastA2A`` builds its own card and has no hook for security schemes, and its
schema spells the requirement list ``securityRequirements`` while the A2A
protocol and its clients read ``security``. So the card is rendered here and the
route is registered ahead of the built-in one.
"""

import json
from typing import Any

from fasta2a.schema import AgentCapabilities, AgentCard, AgentInterface, agent_card_ta
from starlette.requests import Request
from starlette.responses import Response
from starlette.routing import Route

from auth import SECURITY_SCHEME_NAME, configured_token, security_schemes


def build_agent_card(*, name: str, description: str, url: str, version: str = "1.0.0") -> dict[str, Any]:
    card = AgentCard(
        name=name,
        description=description,
        version=version,
        supported_interfaces=[
            AgentInterface(protocol_binding="JSONRPC", url=url, protocol_version="1.0"),
        ],
        skills=[],
        default_input_modes=["application/json"],
        default_output_modes=["application/json"],
        capabilities=AgentCapabilities(streaming=True, push_notifications=False),
    )
    payload: dict[str, Any] = json.loads(agent_card_ta.dump_json(card, by_alias=True))
    payload["url"] = url
    payload["preferredTransport"] = "JSONRPC"

    if configured_token() is not None:
        payload["securitySchemes"] = security_schemes()
        payload["security"] = [{SECURITY_SCHEME_NAME: []}]

    return payload


def agent_card_route(*, name: str, description: str, url: str) -> Route:
    async def endpoint(request: Request) -> Response:
        card = build_agent_card(name=name, description=description, url=url)
        return Response(json.dumps(card), media_type="application/json")

    return Route(
        "/.well-known/agent-card.json",
        endpoint,
        methods=["HEAD", "GET", "OPTIONS"],
    )
