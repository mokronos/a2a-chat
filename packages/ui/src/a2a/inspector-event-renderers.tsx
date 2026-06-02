import React from "react"

import { CodeBlock } from "../components/ai-elements/code-block"
import { MessageResponse } from "../components/ai-elements/message"
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
    if (isRecord(part) && part.kind === "data" && isRecord(part.data)) {
      return part.data
    }
  }

  return null
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
  const input = isRecord(data.input) ? data.input : {}

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
  const output = isRecord(data.output) ? data.output : null
  const taskId = output && typeof output.task_id === "string" ? output.task_id : null

  return (
    <Tool defaultOpen>
      <ToolHeader type="tool-send_task" state="output-available" title="Subagent task created" />
      <ToolContent>
        <ToolOutput
          output={
            taskId ? (
              <div className="p-2 font-mono text-[11px] text-foreground">{taskId}</div>
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

function renderCheckTaskStatusCall(data: Record<string, unknown>) {
  const input = isRecord(data.input) ? data.input : {}

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

function renderGenericToolData(data: Record<string, unknown>) {
  const isResult = data.type === "tool-result"
  const toolName = typeof data.toolName === "string" ? data.toolName : "unknown_tool"

  return (
    <Tool defaultOpen>
      <ToolHeader
        type={`tool-${toolName}`}
        state={isResult ? "output-available" : "input-available"}
      />
      <ToolContent>
        {!isResult && data.input !== undefined ? <ToolInput input={data.input} /> : null}
        {isResult ? <ToolOutput output={data.output ?? data} errorText={undefined} /> : null}
      </ToolContent>
    </Tool>
  )
}

export const renderInspectorToolEvent: MessageTimelineEventRenderer = (event) => {
  const data = getStatusMessageData(event)
  if (!data || typeof data.type !== "string") {
    return null
  }

  const toolName = typeof data.toolName === "string" ? data.toolName : ""

  if (data.type === "tool-call" && toolName === "send_task") {
    return renderSendTaskTool(data)
  }

  if (data.type === "tool-result" && toolName === "send_task") {
    return renderSendTaskResult(data)
  }

  if (data.type === "tool-call" && toolName === "check_task_status") {
    return renderCheckTaskStatusCall(data)
  }

  if (data.type === "tool-result" && toolName === "check_task_status") {
    return renderCheckTaskStatusResult(data)
  }

  if (data.type === "tool-call" || data.type === "tool-result") {
    return renderGenericToolData(data)
  }

  return null
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
