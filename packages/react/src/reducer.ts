import type { Artifact, Message, Part, Task, TaskStatus } from "@a2a-js/sdk"
import {
  isMessageEvent,
  isTaskArtifactUpdateEvent,
  isTaskEvent,
  isTaskStatusUpdateEvent,
} from "./events"
import type { A2AEvent, ConversationId, TurnId } from "./types"

export type TurnLifecycle =
  | { kind: "draft" }
  | { kind: "running" }
  | { kind: "recovering"; attempt: number }
  | { kind: "waiting"; reason: "stream-closed" | "recovery-exhausted"; error?: string }
  | { kind: "awaiting-input"; reason: "input-required" | "auth-required" }
  | { kind: "completed" }
  | { kind: "cancelled" }
  | { kind: "failed"; error: string }

export type Turn = {
  readonly id: TurnId
  readonly request: Message
  readonly events: readonly A2AEvent[]
  readonly taskId?: string
  readonly contextId?: string
  readonly task?: Task
  readonly statusFinal?: boolean
  readonly artifacts: Readonly<Record<string, Artifact>>
  readonly lifecycle: TurnLifecycle
}

export type Conversation = {
  readonly id: ConversationId
  readonly turns: readonly Turn[]
}

export type ConversationAction =
  | { kind: "turn-started"; turn: Turn }
  | { kind: "event-received"; turnId: TurnId; event: A2AEvent }
  | { kind: "turn-recovering"; turnId: TurnId; attempt: number }
  | { kind: "turn-waiting"; turnId: TurnId; reason: "stream-closed" | "recovery-exhausted"; error?: string }
  | { kind: "turn-failed"; turnId: TurnId; error: string }
  | { kind: "turn-cancelled"; turnId: TurnId }

const terminalStates = new Set(["completed", "failed", "canceled", "rejected"])
const pausedStates = new Set(["input-required", "auth-required"])
const activeStateOrder = new Map([
  ["unknown", 0],
  ["submitted", 1],
  ["working", 2],
])

export function taskStatusLifecycle(status: TaskStatus): TurnLifecycle {
  if (status.state === "input-required" || status.state === "auth-required") {
    return { kind: "awaiting-input", reason: status.state }
  }
  if (status.state === "canceled") return { kind: "cancelled" }
  if (status.state === "failed" || status.state === "rejected") {
    return { kind: "failed", error: statusError(status) }
  }
  return terminalStates.has(status.state) ? { kind: "completed" } : { kind: "running" }
}

export function isSettledLifecycle(lifecycle: TurnLifecycle): boolean {
  return lifecycle.kind === "completed" || lifecycle.kind === "cancelled" || lifecycle.kind === "failed"
}

export function isResumableLifecycle(lifecycle: TurnLifecycle): boolean {
  return lifecycle.kind === "running" || lifecycle.kind === "recovering" || lifecycle.kind === "waiting"
}

function statusError(status: TaskStatus): string {
  const text = status.message ? textParts(status.message.parts).join("\n") : ""
  return text || status.state
}

function eventIdentity(event: A2AEvent): { taskId?: string; contextId?: string } {
  if (isTaskEvent(event)) return { taskId: event.id, contextId: event.contextId }
  return { taskId: event.taskId, contextId: event.contextId }
}

function acceptsEvent(turn: Turn, event: A2AEvent): boolean {
  const identity = eventIdentity(event)
  const taskId = turn.taskId ?? turn.task?.id ?? turn.request.taskId
  const contextId = turn.contextId ?? turn.task?.contextId ?? turn.request.contextId

  return (
    (!taskId || !identity.taskId || taskId === identity.taskId) &&
    (!contextId || !identity.contextId || contextId === identity.contextId)
  )
}

function mergeArtifact(
  current: Readonly<Record<string, Artifact>>,
  artifact: Artifact,
  append: boolean,
): Readonly<Record<string, Artifact>> {
  const prior = current[artifact.artifactId]
  if (!append || !prior) return { ...current, [artifact.artifactId]: artifact }

  return {
    ...current,
    [artifact.artifactId]: {
      ...prior,
      ...artifact,
      metadata:
        artifact.metadata === undefined
          ? prior.metadata
          : { ...prior.metadata, ...artifact.metadata },
      parts: [...prior.parts, ...artifact.parts],
    },
  }
}

function mergeSnapshotArtifacts(
  current: Readonly<Record<string, Artifact>>,
  snapshot: readonly Artifact[] | undefined,
  streamedArtifactIds: ReadonlySet<string>,
): Readonly<Record<string, Artifact>> {
  let next = current
  for (const artifact of snapshot ?? []) {
    if (!streamedArtifactIds.has(artifact.artifactId)) {
      next = { ...next, [artifact.artifactId]: artifact }
    }
  }
  return next
}

function preserveNewerStatus(current: TaskStatus | undefined, incoming: TaskStatus, final: boolean | undefined): TaskStatus {
  if (!current) return incoming
  if (final) return current

  const currentPausedOrTerminal = terminalStates.has(current.state) || pausedStates.has(current.state)
  if (currentPausedOrTerminal) return current

  const currentOrder = activeStateOrder.get(current.state)
  const incomingOrder = activeStateOrder.get(incoming.state)
  if (currentOrder !== undefined && incomingOrder !== undefined && currentOrder > incomingOrder) {
    return current
  }

  if (current.timestamp && incoming.timestamp) {
    const currentTime = Date.parse(current.timestamp)
    const incomingTime = Date.parse(incoming.timestamp)
    if (Number.isFinite(currentTime) && Number.isFinite(incomingTime) && currentTime > incomingTime) return current
  }

  return incoming
}

function taskWithArtifacts(task: Task, artifacts: Readonly<Record<string, Artifact>>): Task {
  const values = Object.values(artifacts)
  return values.length > 0 || task.artifacts !== undefined ? { ...task, artifacts: values } : task
}

function applyEvent(turn: Turn, event: A2AEvent): Turn {
  if (!acceptsEvent(turn, event)) return turn

  const identity = eventIdentity(event)
  const base: Turn = {
    ...turn,
    events: [...turn.events, event],
    taskId: turn.taskId ?? identity.taskId,
    contextId: turn.contextId ?? identity.contextId,
  }

  if (isTaskEvent(event)) {
    const streamedArtifactIds = new Set(
      turn.events.flatMap((previous) =>
        isTaskArtifactUpdateEvent(previous) ? [previous.artifact.artifactId] : [],
      ),
    )
    const artifacts = mergeSnapshotArtifacts(base.artifacts, event.artifacts, streamedArtifactIds)
    const task = taskWithArtifacts(
      {
        ...event,
        status: preserveNewerStatus(base.task?.status, event.status, base.statusFinal),
      },
      artifacts,
    )
    return { ...base, task, artifacts, lifecycle: taskStatusLifecycle(task.status) }
  }

  if (isTaskStatusUpdateEvent(event)) {
    const task = taskWithArtifacts(
      {
        ...base.task,
        kind: "task",
        id: event.taskId,
        contextId: event.contextId,
        status: preserveNewerStatus(base.task?.status, event.status, base.statusFinal),
      },
      base.artifacts,
    )
    return {
      ...base,
      task,
      statusFinal: base.statusFinal === true || event.final,
      lifecycle: taskStatusLifecycle(task.status),
    }
  }

  if (isTaskArtifactUpdateEvent(event)) {
    const artifacts = mergeArtifact(base.artifacts, event.artifact, event.append === true)
    return {
      ...base,
      artifacts,
      task: base.task ? taskWithArtifacts(base.task, artifacts) : undefined,
    }
  }

  if (isMessageEvent(event)) return { ...base, lifecycle: { kind: "completed" } }
  return base
}

export function conversationReducer(state: Conversation, action: ConversationAction): Conversation {
  if (action.kind === "turn-started") return { ...state, turns: [...state.turns, action.turn] }

  let changed = false
  const turns = state.turns.map((turn): Turn => {
    if (turn.id !== action.turnId) return turn

    let next: Turn
    switch (action.kind) {
      case "event-received":
        next = applyEvent(turn, action.event)
        break
      case "turn-recovering":
        next = { ...turn, lifecycle: { kind: "recovering", attempt: action.attempt } }
        break
      case "turn-waiting":
        next = {
          ...turn,
          lifecycle: { kind: "waiting", reason: action.reason, error: action.error },
        }
        break
      case "turn-cancelled":
        next = { ...turn, lifecycle: { kind: "cancelled" } }
        break
      case "turn-failed":
        next = { ...turn, lifecycle: { kind: "failed", error: action.error } }
        break
    }
    if (next !== turn) changed = true
    return next
  })

  return changed ? { ...state, turns } : state
}

export function textParts(parts: readonly Part[]): string[] {
  return parts.flatMap((part) => (part.kind === "text" ? [part.text] : []))
}

export function turnMessages(turn: Turn): Message[] {
  const messages: Message[] = [turn.request]
  for (const event of turn.events) {
    if (event.kind === "message") messages.push(event)
  }
  if (turn.task) {
    messages.push(...(turn.task.history ?? []), ...(turn.task.status.message ? [turn.task.status.message] : []))
  }
  return messages
}
