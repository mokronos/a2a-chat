from dotenv import load_dotenv

load_dotenv()
import os
import uuid
from collections.abc import Awaitable, Callable
from contextvars import ContextVar
from typing import Any

import httpx
from fasta2a.client import A2AClient
from fasta2a.schema import Message, Part
from pydantic_ai import Agent, FunctionToolset
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.mcp import MCPServerStreamableHTTP

# executor = MCPServerStreamableHTTP("http://localhost:4788/mcp")

def get_weather(location: str) -> str:
    """Get the weather in a given location."""
    return f"The weather in {location} is sunny with a temperature of 25 degrees Celsius."

AGENTS = [
    {
        "name": "test agent",
        "url": "http://localhost:8000",
    }
]

TERMINAL_STATES = {"completed", "failed", "canceled", "rejected"}
ProgressCallback = Callable[[dict[str, Any]], Awaitable[None]]
progress_callback: ContextVar[ProgressCallback | None] = ContextVar("progress_callback", default=None)


def list_agents() -> list[dict[str, str]]:
    """List A2A agents that can receive delegated tasks."""
    return AGENTS


def _get_text_from_parts(parts: Any) -> list[str]:
    if not isinstance(parts, list):
        return []

    fragments: list[str] = []
    for part in parts:
        if not isinstance(part, dict):
            continue

        text = part.get("text")
        if isinstance(text, str) and text.strip():
            fragments.append(text.strip())

    return fragments


def _get_task_text(task: Any) -> str:
    if not isinstance(task, dict):
        return ""

    status = task.get("status")
    fragments = []
    if isinstance(status, dict):
        message = status.get("message")
        if isinstance(message, dict):
            fragments.extend(_get_text_from_parts(message.get("parts")))

    history = task.get("history")
    if isinstance(history, list):
        for message in history:
            if not isinstance(message, dict) or message.get("role") != "agent":
                continue
            fragments.extend(_get_text_from_parts(message.get("parts")))

    deduped = list(dict.fromkeys(fragment for fragment in fragments if fragment))
    return "\n\n".join(deduped)


async def _emit_progress(data: dict[str, Any]) -> None:
    callback = progress_callback.get()
    if callback is None:
        return

    await callback(data)


def _get_stream_result(event: Any) -> dict[str, Any]:
    if not isinstance(event, dict):
        return {}

    result = event.get("result")
    return result if isinstance(result, dict) else {}


def _get_stream_task(event: Any) -> dict[str, Any] | None:
    result = _get_stream_result(event)
    task = result.get("task")
    return task if isinstance(task, dict) else None


def _get_status_update(event: Any) -> dict[str, Any] | None:
    result = _get_stream_result(event)
    status_update = result.get("status_update") or result.get("statusUpdate")
    return status_update if isinstance(status_update, dict) else None


def _get_message_data(message: Any) -> dict[str, Any] | None:
    if not isinstance(message, dict):
        return None

    parts = message.get("parts")
    if not isinstance(parts, list):
        return None

    for part in parts:
        if not isinstance(part, dict):
            continue
        data = part.get("data")
        if isinstance(data, dict):
            return data

    return None


def _get_task_id(task: dict[str, Any] | None, status_update: dict[str, Any] | None) -> str | None:
    if isinstance(task, dict) and isinstance(task.get("id"), str):
        return task["id"]

    if isinstance(status_update, dict):
        task_id = status_update.get("task_id") or status_update.get("taskId")
        if isinstance(task_id, str):
            return task_id

    return None


async def send_task(url: str, text: str) -> str:
    """Send a text task to an A2A agent URL and return only the final result text."""
    message = Message(
        role="user",
        parts=[Part(text=text)],
        message_id=str(uuid.uuid4()),
    )
    latest_task: dict[str, Any] | None = None
    latest_task_id: str | None = None
    latest_final_text = ""

    async with httpx.AsyncClient(base_url=url, timeout=None) as http_client:
        client = A2AClient(base_url=url, http_client=http_client)

        async for event in client.stream_message(message):
            task = _get_stream_task(event)
            status_update = _get_status_update(event)
            latest_task_id = _get_task_id(task, status_update) or latest_task_id

            if task is not None:
                latest_task = task
                task_text = _get_task_text(task)
                if task_text:
                    latest_final_text = task_text

                status = task.get("status")
                state = status.get("state") if isinstance(status, dict) else None
                await _emit_progress(
                    {
                        "type": "send-task-progress",
                        "toolName": "send_task",
                        "url": url,
                        "taskId": task.get("id"),
                        "contextId": task.get("context_id"),
                        "eventKind": "task",
                        "state": state,
                        "text": task_text,
                        "rawEvent": event,
                    }
                )
                if isinstance(state, str) and state in TERMINAL_STATES:
                    break

            if status_update is not None:
                status = status_update.get("status")
                state = status.get("state") if isinstance(status, dict) else None
                status_text = ""
                if isinstance(status, dict):
                    message = status.get("message")
                    if isinstance(message, dict):
                        status_text = "\n\n".join(_get_text_from_parts(message.get("parts")))
                        if status_text:
                            latest_final_text = status_text

                nested_data = _get_message_data(status.get("message") if isinstance(status, dict) else None)
                if state == "working" and not status_text and nested_data is None:
                    continue

                await _emit_progress(
                    {
                        "type": "send-task-progress",
                        "toolName": "send_task",
                        "url": url,
                        "taskId": latest_task_id,
                        "eventKind": "status-update",
                        "state": state,
                        "text": status_text,
                        "rawEvent": event,
                    }
                )
                if isinstance(state, str) and state in TERMINAL_STATES:
                    break

        if latest_task_id:
            task_response = await client.get_task(latest_task_id)
            result = task_response.get("result") if isinstance(task_response, dict) else None
            task = result.get("task") if isinstance(result, dict) else None
            task_text = _get_task_text(task)
            if task_text:
                return task_text

        if latest_final_text:
            return latest_final_text

        if latest_task is not None:
            state = latest_task.get("status", {}).get("state")
            return f"Task finished without text output. Final state: {state}"

        return "Task stream ended without a task result."


toolset = FunctionToolset([get_weather, list_agents, send_task])

model = OpenAIChatModel(
    'big-pickle',
    provider=OpenAIProvider(
        base_url='https://opencode.ai/zen/v1', api_key=os.environ["OPENCODE_ZEN_API_KEY"]
    ),
)

agent = Agent(
    model,
    name="openrouter-free-agent",
    instructions="You are a concise, helpful assistant.",
    toolsets=[toolset],
)
