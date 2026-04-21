import uuid
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

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

Context = list[Message]
"""The shape of the context you store in the storage."""

from agent import agent

logger = logging.getLogger(__name__)


class InMemoryWorker(Worker[Context]):
    async def run_task(self, params: TaskSendParams) -> None:
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

        context = await self.storage.load_context(task['context_id']) or []
        context.extend(task.get('history', []))

        user_message = context[-1]['parts'][0]['text']
        current_artifact_id = None

        try:
            async for event in agent.run_stream_events(user_message):
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
                            
                        await update_task_with_status(state='working', new_artifacts=[artifact])
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
                            
                        await update_task_with_status(state='working', new_artifacts=[artifact])
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
                            parts=[Part(text=thinking_content)],
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
                        "tool_name": tool_name,
                        "args": args,
                        "tool_call_id": tool_call_id,
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
                        "tool_name": tool_name,
                        "content": content,
                        "tool_call_id": tool_call_id,
                        "timestamp": timestamp,
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

        await self.storage.update_context(task['context_id'], context)

    async def cancel_task(self, params: TaskIdParams) -> None: ...

    def build_message_history(self, history: list[Message]) -> list[Any]: ...

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
