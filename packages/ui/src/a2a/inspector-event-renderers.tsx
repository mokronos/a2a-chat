import React from "react"
import { GitBranchIcon } from "lucide-react"

import { CodeBlock } from "../components/ai-elements/code-block"
import { MessageResponse } from "../components/ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../components/ai-elements/reasoning"
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "../components/ai-elements/task"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../components/ai-elements/tool"
import type {
  MessageTimelineEvent,
  MessageTimelineEventRenderer,
} from "../components/shared/message-box"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getStatusMessageData(event: MessageTimelineEvent): Record<string, unknown> | null {
  const rawEvent = event.rawEvent
  if (!isRecord(rawEvent)) {
    return null
  }

  if (rawEvent.kind === "status-update" && isRecord(rawEvent.status)) {
    const data = getFirstDataPartFromMessage(rawEvent.status.message)
    if (data) {
      return data
    }
  }

  if (rawEvent.kind === "task" && Array.isArray(rawEvent.history)) {
    for (const message of [...rawEvent.history].reverse()) {
      const data = getFirstDataPartFromMessage(message)
      if (data) {
        return data
      }
    }
  }

  return null
}

function getFirstDataPartFromMessage(message: unknown): Record<string, unknown> | null {
  if (!isRecord(message) || !Array.isArray(message.parts)) {
    return null
  }

  for (const part of message.parts) {
    if (
      isRecord(part) &&
      (part.kind === "data" || typeof part.kind === "undefined") &&
      isRecord(part.data)
    ) {
      return part.data
    }
  }

  return null
}

function getNestedStreamDataPart(rawEvent: unknown): Record<string, unknown> | null {
  if (!isRecord(rawEvent) || !isRecord(rawEvent.result)) {
    return null
  }

  const result = rawEvent.result
  const statusUpdate = isRecord(result.status_update)
    ? result.status_update
    : isRecord(result.statusUpdate)
      ? result.statusUpdate
      : null

  if (statusUpdate && isRecord(statusUpdate.status)) {
    return getFirstDataPartFromMessage(statusUpdate.status.message)
  }

  const task = isRecord(result.task) ? result.task : null
  if (task && Array.isArray(task.history)) {
    for (const message of [...task.history].reverse()) {
      const data = getFirstDataPartFromMessage(message)
      if (data) {
        return data
      }
    }
  }

  return null
}

function parseToolInput(input: unknown): unknown {
  if (typeof input !== "string") {
    return input
  }

  try {
    return JSON.parse(input)
  } catch {
    return input
  }
}

function getArtifactText(event: MessageTimelineEvent): string | null {
  const rawEvent = event.rawEvent
  if (!isRecord(rawEvent) || rawEvent.kind !== "artifact-update" || !isRecord(rawEvent.artifact)) {
    return null
  }

  const parts = rawEvent.artifact.parts
  if (!Array.isArray(parts)) {
    return null
  }

  const text = parts
    .flatMap((part) =>
      isRecord(part) && part.kind === "text" && typeof part.text === "string" ? [part.text] : []
    )
    .join("")

  return text.length > 0 ? text : null
}

function renderSendTaskTool(data: Record<string, unknown>) {
  const input = parseToolInput(data.input)

  return (
    <Tool defaultOpen>
      <ToolHeader type="tool-send_task" state="input-available" title="Calling subagent" />
      <ToolContent>
        <ToolInput input={input} />
      </ToolContent>
    </Tool>
  )
}

function renderSendTaskResult(data: Record<string, unknown>) {
  const output = data.output
  const taskId =
    isRecord(output) && typeof output.task_id === "string"
      ? output.task_id
      : isRecord(output) && typeof output.taskId === "string"
        ? output.taskId
        : null

  return (
    <Tool defaultOpen>
      <ToolHeader type="tool-send_task" state="output-available" title="Subagent result" />
      <ToolContent>
        <ToolOutput
          output={
            taskId ? (
              <div className="p-2 font-mono text-[11px] text-foreground">{taskId}</div>
            ) : typeof output === "string" ? (
              <MessageResponse className="p-2 text-xs">{output}</MessageResponse>
            ) : (
              output
            )
          }
          errorText={undefined}
        />
      </ToolContent>
    </Tool>
  )
}

function renderSendTaskProgress(data: Record<string, unknown>) {
  const state = typeof data.state === "string" ? data.state : "updated"
  const url = typeof data.url === "string" ? data.url : null
  const taskId = typeof data.taskId === "string" ? data.taskId : null
  const text = typeof data.text === "string" ? data.text.trim() : ""
  const nestedData = getNestedStreamDataPart(data.rawEvent)
  const nestedTool =
    nestedData && nestedData !== data && typeof nestedData.type === "string"
      ? renderToolData(nestedData, false)
      : null
  const nestedThinking =
    nestedData?.type === "thinking" && typeof nestedData.text === "string"
      ? nestedData.text.trim()
      : ""

  return (
    <Task defaultOpen>
      <TaskTrigger title="Subagent progress">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <GitBranchIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="font-medium text-foreground">Subagent</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase">
            {state}
          </span>
          {taskId ? <span className="truncate font-mono text-[10px]">{taskId}</span> : null}
        </div>
      </TaskTrigger>
      <TaskContent className="[&>div]:rounded-md">
        {url ? (
          <TaskItem className="truncate px-0 py-0 font-mono text-[10px]">{url}</TaskItem>
        ) : null}
        {nestedTool ? <TaskItem className="border-l px-0 py-0 pl-3">{nestedTool}</TaskItem> : null}
        {nestedThinking ? (
          <TaskItem className="px-0 py-0">
            <Reasoning defaultOpen={false}>
              <ReasoningTrigger />
              <ReasoningContent>{nestedThinking}</ReasoningContent>
            </Reasoning>
          </TaskItem>
        ) : null}
        {text.length > 0 ? (
          <TaskItem className="px-0 py-0 text-foreground">
            <MessageResponse className="text-xs">{text}</MessageResponse>
          </TaskItem>
        ) : null}
      </TaskContent>
    </Task>
  )
}

function renderCheckTaskStatusCall(data: Record<string, unknown>) {
  const input = parseToolInput(data.input)

  return (
    <Tool defaultOpen>
      <ToolHeader
        type="tool-check_task_status"
        state="input-available"
        title="Checking subagent status"
      />
      <ToolContent>
        <ToolInput input={input} />
      </ToolContent>
    </Tool>
  )
}

function renderCheckTaskStatusResult(data: Record<string, unknown>) {
  const output = isRecord(data.output) ? data.output : null
  const status = output && isRecord(output.status) && typeof output.status.state === "string"
    ? output.status.state
    : "unknown"
  const artifacts = output && Array.isArray(output.artifacts) ? output.artifacts : []
  const artifactText = artifacts
    .flatMap((artifact) => {
      if (!isRecord(artifact) || !Array.isArray(artifact.parts)) {
        return []
      }

      return artifact.parts.flatMap((part) =>
        isRecord(part) && part.kind === "text" && typeof part.text === "string" ? [part.text] : []
      )
    })
    .join("")

  return (
    <Tool defaultOpen>
      <ToolHeader
        type="tool-check_task_status"
        state="output-available"
        title={`Subagent status: ${status}`}
      />
      <ToolContent>
        <ToolOutput
          output={
            artifactText.length > 0 ? (
              <MessageResponse className="p-2 text-xs">{artifactText}</MessageResponse>
            ) : (
              data.output
            )
          }
          errorText={undefined}
        />
      </ToolContent>
    </Tool>
  )
}

function renderGenericToolData(data: Record<string, unknown>, defaultOpen = true) {
  const isResult = data.type === "tool-result"
  const toolName = typeof data.toolName === "string" ? data.toolName : "unknown_tool"

  return (
    <Tool defaultOpen={defaultOpen}>
      <ToolHeader
        type={`tool-${toolName}`}
        state={isResult ? "output-available" : "input-available"}
      />
      <ToolContent>
        {!isResult && data.input !== undefined ? (
          <ToolInput input={parseToolInput(data.input)} />
        ) : null}
        {isResult ? <ToolOutput output={data.output ?? data} errorText={undefined} /> : null}
      </ToolContent>
    </Tool>
  )
}

function renderToolData(data: Record<string, unknown>, defaultOpen = true) {
  const toolName = typeof data.toolName === "string" ? data.toolName : ""

  if (data.type === "tool-call" && toolName === "send_task") {
    return renderSendTaskTool(data)
  }

  if (data.type === "tool-result" && toolName === "send_task") {
    return renderSendTaskResult(data)
  }

  if (data.type === "send-task-progress" && toolName === "send_task") {
    return renderSendTaskProgress(data)
  }

  if (data.type === "tool-call" && toolName === "check_task_status") {
    return renderCheckTaskStatusCall(data)
  }

  if (data.type === "tool-result" && toolName === "check_task_status") {
    return renderCheckTaskStatusResult(data)
  }

  if (data.type === "tool-call" || data.type === "tool-result") {
    return renderGenericToolData(data, defaultOpen)
  }

  return null
}

export const renderInspectorToolEvent: MessageTimelineEventRenderer = (event) => {
  const data = getStatusMessageData(event)
  if (!data || typeof data.type !== "string") {
    return null
  }

  return renderToolData(data)
}

export const renderInspectorArtifactEvent: MessageTimelineEventRenderer = (event) => {
  const text = getArtifactText(event)
  if (!text) {
    return null
  }

  return (
    <CodeBlock code={text} language="markdown" className="text-[11px]" />
  )
}

export const inspectorEventRenderers: MessageTimelineEventRenderer[] = [
  renderInspectorToolEvent,
  renderInspectorArtifactEvent,
]
