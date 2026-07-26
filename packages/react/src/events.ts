import type {
  Artifact,
  Message,
  Part,
  Task,
  TaskArtifactUpdateEvent,
  TaskStatus,
  TaskStatusUpdateEvent,
} from "@a2a-js/sdk"
import type { A2AEvent } from "./types"

const taskStates = new Set([
  "submitted",
  "working",
  "input-required",
  "completed",
  "canceled",
  "failed",
  "rejected",
  "auth-required",
  "unknown",
])

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isOptionalRecord(value: unknown): boolean {
  return value === undefined || isRecord(value)
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string"
}

function isOptionalStringArray(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"))
}

export function isPart(value: unknown): value is Part {
  if (!isRecord(value) || !isOptionalRecord(value.metadata)) return false

  if (value.kind === "text") return typeof value.text === "string"
  if (value.kind === "data") return isRecord(value.data)
  if (value.kind !== "file" || !isRecord(value.file)) return false

  return (
    (typeof value.file.bytes === "string") !== (typeof value.file.uri === "string") &&
    isOptionalString(value.file.mimeType) &&
    isOptionalString(value.file.name)
  )
}

export function isMessageEvent(value: unknown): value is Message {
  return (
    isRecord(value) &&
    value.kind === "message" &&
    typeof value.messageId === "string" &&
    (value.role === "agent" || value.role === "user") &&
    Array.isArray(value.parts) &&
    value.parts.every(isPart) &&
    isOptionalString(value.taskId) &&
    isOptionalString(value.contextId) &&
    isOptionalStringArray(value.extensions) &&
    isOptionalStringArray(value.referenceTaskIds) &&
    isOptionalRecord(value.metadata)
  )
}

export function isArtifact(value: unknown): value is Artifact {
  return (
    isRecord(value) &&
    typeof value.artifactId === "string" &&
    Array.isArray(value.parts) &&
    value.parts.every(isPart) &&
    isOptionalString(value.name) &&
    isOptionalString(value.description) &&
    isOptionalStringArray(value.extensions) &&
    isOptionalRecord(value.metadata)
  )
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    isRecord(value) &&
    typeof value.state === "string" &&
    taskStates.has(value.state) &&
    isOptionalString(value.timestamp) &&
    (value.message === undefined || isMessageEvent(value.message))
  )
}

export function isTaskEvent(value: unknown): value is Task {
  return (
    isRecord(value) &&
    value.kind === "task" &&
    typeof value.id === "string" &&
    typeof value.contextId === "string" &&
    isTaskStatus(value.status) &&
    (value.artifacts === undefined || (Array.isArray(value.artifacts) && value.artifacts.every(isArtifact))) &&
    (value.history === undefined || (Array.isArray(value.history) && value.history.every(isMessageEvent))) &&
    isOptionalRecord(value.metadata)
  )
}

export function isTaskStatusUpdateEvent(value: unknown): value is TaskStatusUpdateEvent {
  return (
    isRecord(value) &&
    value.kind === "status-update" &&
    typeof value.taskId === "string" &&
    typeof value.contextId === "string" &&
    typeof value.final === "boolean" &&
    isTaskStatus(value.status) &&
    isOptionalRecord(value.metadata)
  )
}

export function isTaskArtifactUpdateEvent(value: unknown): value is TaskArtifactUpdateEvent {
  return (
    isRecord(value) &&
    value.kind === "artifact-update" &&
    typeof value.taskId === "string" &&
    typeof value.contextId === "string" &&
    isArtifact(value.artifact) &&
    (value.append === undefined || typeof value.append === "boolean") &&
    (value.lastChunk === undefined || typeof value.lastChunk === "boolean") &&
    isOptionalRecord(value.metadata)
  )
}

export function isA2AEvent(value: unknown): value is A2AEvent {
  if (!isRecord(value)) return false

  switch (value.kind) {
    case "message":
      return isMessageEvent(value)
    case "task":
      return isTaskEvent(value)
    case "status-update":
      return isTaskStatusUpdateEvent(value)
    case "artifact-update":
      return isTaskArtifactUpdateEvent(value)
    default:
      return false
  }
}
