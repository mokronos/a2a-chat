import React from "react"

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

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function CompactJson({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-sm bg-muted/40 p-1.5 text-[10px] text-muted-foreground">
      {formatJson(value)}
    </pre>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-[11px] text-foreground [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

function renderSendTaskTool(data: Record<string, unknown>) {
  const input = isRecord(data.input) ? data.input : {}
  const agent = typeof input.agent === "string" ? input.agent : "unknown agent"
  const content = typeof input.content === "string" ? input.content : ""

  return (
    <div className="rounded-md border border-sky-500/25 bg-sky-500/10 p-2">
      <div className="text-[11px] font-semibold text-sky-800 dark:text-sky-200">Calling subagent</div>
      <div className="mt-1 grid gap-2">
        <Field label="Agent">{agent}</Field>
        {content.length > 0 ? <Field label="Message">{content}</Field> : null}
      </div>
    </div>
  )
}

function renderSendTaskResult(data: Record<string, unknown>) {
  const output = isRecord(data.output) ? data.output : null
  const taskId = output && typeof output.task_id === "string" ? output.task_id : null

  return (
    <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 p-2">
      <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">Subagent task created</div>
      {taskId ? <div className="mt-1 font-mono text-[11px] text-foreground">{taskId}</div> : null}
      {!taskId ? <CompactJson value={data.output} /> : null}
    </div>
  )
}

function renderCheckTaskStatusCall(data: Record<string, unknown>) {
  const input = isRecord(data.input) ? data.input : {}
  const taskId = typeof input.task_id === "string" ? input.task_id : "unknown task"

  return (
    <div className="rounded-md border border-violet-500/25 bg-violet-500/10 p-2">
      <div className="text-[11px] font-semibold text-violet-800 dark:text-violet-200">Checking subagent status</div>
      <div className="mt-1 font-mono text-[11px] text-foreground [overflow-wrap:anywhere]">{taskId}</div>
    </div>
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
    <div className="rounded-md border border-violet-500/25 bg-violet-500/10 p-2">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-semibold text-violet-800 dark:text-violet-200">Subagent status</span>
        <span className="rounded-full border border-violet-500/30 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground">{status}</span>
      </div>
      {artifactText.length > 0 ? (
        <blockquote className="mt-1 border-l-2 border-violet-500/40 pl-2 text-[11px] text-foreground whitespace-pre-wrap">
          {artifactText}
        </blockquote>
      ) : (
        <div className="mt-1">
          <CompactJson value={data.output} />
        </div>
      )}
    </div>
  )
}

function renderGenericToolData(data: Record<string, unknown>) {
  const type = typeof data.type === "string" ? data.type : "tool-event"
  const toolName = typeof data.toolName === "string" ? data.toolName : "unknown tool"

  return (
    <div className="rounded-md border border-border/50 bg-muted/30 p-2">
      <div className="text-[11px] font-semibold text-foreground">{type}: {toolName}</div>
      <div className="mt-1">
        <CompactJson value={data.input ?? data.output ?? data} />
      </div>
    </div>
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
    <div className="rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-[11px] text-foreground whitespace-pre-wrap [overflow-wrap:anywhere]">
      {text}
    </div>
  )
}

export const inspectorEventRenderers: MessageTimelineEventRenderer[] = [
  renderInspectorToolEvent,
  renderInspectorArtifactEvent,
]
