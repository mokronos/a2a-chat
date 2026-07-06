import uuid
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import anyio

from fasta2a import FastA2A, Worker
from fasta2a.broker import InMemoryBroker
from fasta2a.schema import (
    Artifact,
    Message,
    Part,
    StreamResponse,
    TaskArtifactUpdateEvent,
    TaskIdParams,
    TaskSendParams,
    TaskStatus,
    TaskStatusUpdateEvent,
)
from fasta2a.storage import InMemoryStorage
from pydantic_ai import (
    AgentRunResultEvent,
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    PartDeltaEvent,
    PartEndEvent,
    PartStartEvent,
    TextPart,
    TextPartDelta,
    ThinkingPart,
)
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart as ModelTextPart,
    UserPromptPart,
)

Context = list[Message]
"""The shape of the context you store in the storage."""

from agent import agent, progress_callback

logger = logging.getLogger(__name__)


class InMemoryWorker(Worker[Context]):
    # Cancel scopes for tasks that are currently running, keyed by task id.
    _cancel_scopes: dict[str, anyio.CancelScope]
    _task_group: anyio.abc.TaskGroup

    @asynccontextmanager
    async def run(self) -> AsyncIterator[None]:
        """Run the worker.

        We override the base implementation so task execution happens in
        background tasks within this group. Otherwise `run_task` would block the
        worker's operation loop, and a `cancel` operation could never be received
        until the task it is meant to cancel had already finished.
        """
        self._cancel_scopes = {}
        async with anyio.create_task_group() as tg:
            self._task_group = tg
            tg.start_soon(self._loop)
            yield
            tg.cancel_scope.cancel()

    async def run_task(self, params: TaskSendParams) -> None:
        # Hand the actual work off so the worker loop stays free to receive a
        # subsequent `cancel` operation for this task.
        self._task_group.start_soon(self._execute_task, params)

    async def _execute_task(self, params: TaskSendParams) -> None:
        task_id = params['id']
        try:
            with anyio.CancelScope() as scope:
                self._cancel_scopes[task_id] = scope
                await self._run_task_impl(params)
        except Exception as e:
            # Mark the task failed instead of crashing the worker's task group.
            logger.exception(e)
            task = await self.storage.update_task(task_id, state='failed')
            await self.broker.event_bus.emit(
                task_id,
                StreamResponse(
                    status_update=TaskStatusUpdateEvent(
                        task_id=task_id,
                        context_id=task['context_id'],
                        status=TaskStatus(state='failed'),
                    )
                ),
            )
            await self.broker.event_bus.close(task_id)
        finally:
            self._cancel_scopes.pop(task_id, None)

    async def _run_task_impl(self, params: TaskSendParams) -> None:
        task = await self.storage.load_task(params['id'])
        assert task is not None

        async def update_task_with_status(
            *,
            state: str,
            new_artifacts: list[Artifact] | None = None,
            new_messages: list[Message] | None = None,
        ) -> None:
            await self.storage.update_task(
                task['id'],
                state=state,
                new_artifacts=new_artifacts,
                new_messages=new_messages,
            )
            status = TaskStatus(state=state)
            if new_messages:
                status = TaskStatus(state=state, message=new_messages[-1])

            await self.broker.event_bus.emit(
                task['id'],
                StreamResponse(
                    status_update=TaskStatusUpdateEvent(
                        task_id=task['id'],
                        context_id=task['context_id'],
                        status=status,
                    )
                ),
            )

        await update_task_with_status(state='working')

        context = list(await self.storage.load_context(task['context_id']) or [])
        context.extend(task.get('history', []))

        user_message = self.get_latest_user_text(context)
        message_history = self.build_message_history(context[:-1])
        current_artifact_id = None

        async def emit_tool_progress(data: dict[str, Any]) -> None:
            message = Message(
                role='agent',
                parts=[Part(data=data)],
                message_id=str(uuid.uuid4()),
            )
            context.append(message)
            await update_task_with_status(state='working', new_messages=[message])

        try:
            progress_token = progress_callback.set(emit_tool_progress)
            async for event in agent.run_stream_events(
                user_message,
                message_history=message_history,
            ):
                if isinstance(event, PartStartEvent):
                    # PartStartEvent(index=1, part=TextPart(content='The weather in New York is **sunny with a temperature of 25°C**.'), previous_part_kind='thinking')
                    if isinstance(event.part, TextPart):
                        assert current_artifact_id is None
                        current_artifact_id = str(uuid.uuid4())

                        text_content = event.part.content

                        artifact = Artifact(
                            name="final_response",
                            artifact_id=current_artifact_id,
                            parts=[Part(text=text_content)],
                        )

                        await self.storage.update_task(
                            task['id'],
                            state='working',
                            new_artifacts=[artifact],
                        )
                        await self.broker.event_bus.emit(
                            task['id'],
                            StreamResponse(
                                artifact_update=TaskArtifactUpdateEvent(
                                    task_id=task['id'],
                                    context_id=task['context_id'],
                                    artifact=artifact,
                                    append=False,
                                    last_chunk=False,
                                )
                            ),
                        )

                    # PartStartEvent(index=0, part=ThinkingPart(content='The user', id='reasoning', provider_name='openai'))
                    # PartStartEvent(index=1, part=ToolCallPart(tool_name='get_weather', args='', tool_call_id='call_function_j4jv8tdwiqss_1'), previous_part_kind='thinking')
                    # PartStartEvent(index=0, part=ThinkingPart(content='The function', id='reasoning', provider_name='openai'))
                    # Thinking and ToolCalling handeled non-streaming below
                    print("Ignoring part start event:")
                    print(event, flush=True)

                if isinstance(event, PartDeltaEvent):

                    if isinstance(event.delta, TextPartDelta):
                        assert current_artifact_id is not None

                        content_delta = event.delta.content_delta

                        artifact = Artifact(
                            name="final_response",
                            artifact_id=current_artifact_id,
                            parts=[Part(text=content_delta)],
                        )

                        await self.storage.update_task(
                            task['id'],
                            state='working',
                            new_artifacts=[artifact],
                        )
                        await self.broker.event_bus.emit(
                            task['id'],
                            StreamResponse(
                                artifact_update=TaskArtifactUpdateEvent(
                                    task_id=task['id'],
                                    context_id=task['context_id'],
                                    artifact=artifact,
                                    append=True,
                                    last_chunk=False,
                                )
                            ),
                        )

                    # PartDeltaEvent(index=0, delta=ThinkingPartDelta(content_delta=' is asking about the weather in New York. I\'ll use the get_weather function with "New York" as the location parameter.'))
                    # PartDeltaEvent(index=1, delta=ToolCallPartDelta(args_delta='{"location": "New York"}', tool_call_id='call_function_j4jv8tdwiqss_1'))
                    # PartDeltaEvent(index=0, delta=ThinkingPartDelta(content_delta=" has returned the weather information for New York. It's sunny with a temperature of 25 degrees Celsius. I'll relay this information to the user."))
                    print("Ignoring part delta event:")
                    print(event, flush=True)

                if isinstance(event, PartEndEvent):

                    # PartEndEvent(index=0, part=ThinkingPart(content='The user is asking about the weather in New York. I\'ll use the get_weather function with "New York" as the location parameter.', id='reasoning', provider_name='openai'), next_part_kind='tool-call')
                    # PartEndEvent(index=0, part=ThinkingPart(content="The function has returned the weather information for New York. It's sunny with a temperature of 25 degrees Celsius. I'll relay this information to the user.", id='reasoning', provider_name='openai'), next_part_kind='text')
                    if isinstance(event.part, ThinkingPart):
                        thinking_content = event.part.content
                        message = Message(
                            role='agent',
                            parts=[
                                Part(
                                    data={
                                        "type": "thinking",
                                        "text": thinking_content,
                                    }
                                )
                            ],
                            message_id=str(uuid.uuid4()),
                        )
                        context.append(message)
                        await update_task_with_status(state='working', new_messages=[message])

                    # PartEndEvent(index=1, part=ToolCallPart(tool_name='get_weather', args='{"location": "New York"}', tool_call_id='call_function_j4jv8tdwiqss_1'))
                    # PartEndEvent(index=1, part=TextPart(content='The weather in New York is **sunny with a temperature of 25°C**.'))
                    # Using FunctionToolCallEvent instead of PartEndEvent
                    # Using AgentRunResultEvent instead of PartEndEvent
                    print("Ignoring part end event:")
                    print(event, flush=True)

                # FunctionToolCallEvent(part=ToolCallPart(tool_name='get_weather', args='{"location": "New York"}', tool_call_id='call_function_j4jv8tdwiqss_1'), args_valid=True)
                if isinstance(event, FunctionToolCallEvent):
                    tool_name = event.part.tool_name
                    args = event.part.args
                    tool_call_id = event.part.tool_call_id

                    tool_data = {
                        "type": "tool-call",
                        "toolName": tool_name,
                        "args": args,
                        "toolCallId": tool_call_id,
                        "input": args,
                    }
                    message = Message(
                        role='agent',
                        parts=[Part(data=tool_data)],
                        message_id=str(uuid.uuid4()),
                    )
                    context.append(message)
                    await update_task_with_status(state='working', new_messages=[message])

                # FunctionToolResultEvent(result=ToolReturnPart(tool_name='get_weather', content='The weather in New York is sunny with a temperature of 25 degrees Celsius.', tool_call_id='call_function_j4jv8tdwiqss_1', timestamp=datetime.datetime(2026, 4, 20, 16, 36, 29, 272484, tzinfo=datetime.timezone.utc)))
                if isinstance(event, FunctionToolResultEvent):
                    tool_name = event.result.tool_name
                    content = event.result.content
                    tool_call_id = event.result.tool_call_id
                    timestamp = event.result.timestamp

                    tool_return_data = {
                        "type": "tool-result",
                        "toolName": tool_name,
                        "content": content,
                        "toolCallId": tool_call_id,
                        "timestamp": timestamp,
                        "output": content,
                    }

                    message = Message(
                        role='agent',
                        parts=[Part(data=tool_return_data)],
                        message_id=str(uuid.uuid4()),
                    )
                    context.append(message)
                    await update_task_with_status(state='working', new_messages=[message])


                # FinalResultEvent(tool_name=None, tool_call_id=None)
                if isinstance(event, FinalResultEvent):
                    # not sure what to do with this
                    print("Ignoring final result event:")
                    print(event, flush=True)

                # AgentRunResultEvent(result=AgentRunResult(output='The weather in New York is **sunny with a temperature of 25°C**.'))
                if isinstance(event, AgentRunResultEvent):
                    full_output = event.result.output
                    message = Message(
                        role='agent',
                        parts=[Part(text=full_output)],
                        message_id=str(uuid.uuid4()),
                    )
                    context.append(message)
                    await update_task_with_status(state='completed', new_messages=[message])
                    await self.broker.event_bus.close(task['id'])


        except Exception as e:
            logger.exception(e)
            raise
        finally:
            progress_callback.reset(progress_token)

        await self.storage.update_context(task['context_id'], context)

    async def cancel_task(self, params: TaskIdParams) -> None:
        task_id = params['id']

        # Stop the in-flight run, if any. The cancel scope interrupts the agent
        # stream at its next await, so no further updates are emitted.
        scope = self._cancel_scopes.pop(task_id, None)
        if scope is not None:
            scope.cancel()

        task = await self.storage.update_task(task_id, state='canceled')
        await self.broker.event_bus.emit(
            task_id,
            StreamResponse(
                status_update=TaskStatusUpdateEvent(
                    task_id=task_id,
                    context_id=task['context_id'],
                    status=TaskStatus(state='canceled'),
                )
            ),
        )
        await self.broker.event_bus.close(task_id)

    def get_message_text(self, message: Message) -> str:
        fragments: list[str] = []
        for part in message.get('parts', []):
            text = part.get('text')
            if isinstance(text, str) and text.strip():
                fragments.append(text.strip())
        return '\n'.join(fragments)

    def get_latest_user_text(self, history: list[Message]) -> str:
        for message in reversed(history):
            if message.get('role') != 'user':
                continue

            text = self.get_message_text(message)
            if text:
                return text

        raise ValueError('Task history does not contain a user text message')

    def build_message_history(self, history: list[Message]) -> list[Any]:
        message_history: list[ModelMessage] = []
        for message in history:
            text = self.get_message_text(message)
            if not text:
                continue

            role = message.get('role')
            if role == 'user':
                message_history.append(ModelRequest(parts=[UserPromptPart(content=text)]))
            elif role == 'agent':
                message_history.append(ModelResponse(parts=[ModelTextPart(content=text)]))

        return message_history

    def build_artifacts(self, result: Any) -> list[Artifact]: ...


storage = InMemoryStorage()
broker = InMemoryBroker()
worker = InMemoryWorker(storage=storage, broker=broker)


@asynccontextmanager
async def lifespan(app: FastA2A) -> AsyncIterator[None]:
    async with app.task_manager:
        async with worker.run():
            yield


app = FastA2A(storage=storage, broker=broker, lifespan=lifespan)

def main() -> None:
    import uvicorn
    uvicorn.run("fast:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
