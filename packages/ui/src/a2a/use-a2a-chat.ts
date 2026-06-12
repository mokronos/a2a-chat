import React from "react"
import { Effect } from "effect"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Task } from "@a2a-js/sdk"

import type {
  Message,
  MessageStatusHistoryEntry,
  MessageTimelineEvent,
} from "../components/shared/message-box"
import {
  buildA2AMessage,
  createId,
  extractTask,
  extractTextFromParts,
  getTaskText,
  isRecord,
  normalizeBaseUrl,
} from "./helpers"
import { createProxyTransport } from "./proxy"
import {
  cancelTaskById,
  connectJsonRpc,
  getTaskById,
  resubscribeToTask,
  sendTaskMessageStream,
} from "./service"
import type { A2AClient, A2AConversationState, ConnectionState } from "./types"

type ConnectionStore = {
  state: ConnectionState
  message: string
  client: A2AClient | null
  connectedUrl: string | null
  pendingUrl: string | null
  acceptedOutputModes: string[]
  agentName: string | null
}

type TaskSession = {
  id: string
  title: string
  messages: Message[]
  conversationState: A2AConversationState
  createdAt: number
  updatedAt: number
}

export type PersistedTaskSession = {
  id: string
  title: string
  messages: Message[]
  conversationState: A2AConversationState
  createdAt: number
  updatedAt: number
}

export type A2AChatPersistenceAdapter = {
  loadSessions: (input: { url: string }) => Promise<PersistedTaskSession[]>
  deleteSession?: (input: { url: string; sessionId: string }) => Promise<void>
}

type UrlChatState = {
  activeSessionId: string
  sessions: TaskSession[]
  agentName: string | null
  lastConnectedAt: number | null
}

type ChatStore = {
  byUrl: Record<string, UrlChatState>
}

const connectionKey = ["a2a", "connection"] as const
const chatKey = ["a2a", "chat"] as const
const TERMINAL_STATES = new Set(["completed", "failed", "canceled", "rejected"])
const DEFAULT_TASK_TITLE = "New Task"

type UseA2AChatOptions = {
  initialUrl?: string
  proxyBasePath?: string | false
  autoConnect?: boolean
  persistence?: A2AChatPersistenceAdapter
}

type TaskStreamProcessResult = {
  task: Task | null
  done: boolean
}

type SendTaskVariables = {
  taskText: string
  assistantMessageId: string
  urlKey: string
  taskSessionId: string
}

type TaskSessionSummary = {
  id: string
  title: string
  updatedAt: number
}

type RecentAgentSummary = {
  url: string
  agentName: string | null
  lastConnectedAt: number | null
}

export type UseA2AChatResult = {
  url: string
  setUrl: React.Dispatch<React.SetStateAction<string>>
  connectionState: ConnectionState
  connectionMessage: string
  agentName: string | null
  taskInput: string
  setTaskInput: React.Dispatch<React.SetStateAction<string>>
  isSending: boolean
  messages: Message[]
  recentAgents: RecentAgentSummary[]
  taskSessions: TaskSessionSummary[]
  activeTaskSessionId: string | null
  handleConnect: () => void
  handleSelectRecentAgent: (agentUrl: string) => void
  handleSubmitTask: (taskTextOverride?: string) => void
  handleCancelTask: () => void
  handleCreateTaskSession: () => void
  handleSelectTaskSession: (sessionId: string) => void
  handleDeleteTaskSession: (sessionId: string) => void
}

function isTerminalTask(task: Task) {
  return TERMINAL_STATES.has(task.status.state)
}

function formatTaskStatus(status: string) {
  return status
    .split(/[-_\s]+/)
    .filter((token) => token.length > 0)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ")
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error
  }

  return fallback
}

function extractResponseMessageText(response: unknown): string {
  if (isRecord(response) && Array.isArray(response.parts)) {
    return extractTextFromParts(response.parts).join("\n")
  }

  if (isRecord(response) && isRecord(response.result) && Array.isArray(response.result.parts)) {
    return extractTextFromParts(response.result.parts).join("\n")
  }

  return ""
}

type StatusUpdateEvent = {
  kind: "status-update"
  taskId?: string
  status: Task["status"]
}

type ArtifactUpdateEvent = {
  kind: "artifact-update"
  taskId?: string
  artifact?: {
    parts?: unknown
  }
  lastChunk?: boolean
}

function normalizeStreamEvent(event: unknown): unknown {
  if (!isRecord(event)) {
    return event
  }

  if (isRecord(event.task)) {
    return event.task
  }

  if (isRecord(event.statusUpdate)) {
    return {
      kind: "status-update",
      ...event.statusUpdate,
    }
  }

  if (isRecord(event.artifactUpdate)) {
    return {
      kind: "artifact-update",
      ...event.artifactUpdate,
    }
  }

  return event
}

function getStatusUpdateEvent(event: unknown): StatusUpdateEvent | null {
  const normalized = normalizeStreamEvent(event)
  if (!isRecord(normalized) || normalized.kind !== "status-update" || !isRecord(normalized.status)) {
    return null
  }

  return {
    kind: "status-update",
    taskId:
      typeof normalized.taskId === "string"
        ? normalized.taskId
        : typeof normalized.task_id === "string"
          ? normalized.task_id
          : undefined,
    status: normalized.status as unknown as Task["status"],
  }
}

function getArtifactUpdateEvent(event: unknown): ArtifactUpdateEvent | null {
  const normalized = normalizeStreamEvent(event)
  if (!isRecord(normalized) || normalized.kind !== "artifact-update") {
    return null
  }

  return {
    kind: "artifact-update",
    taskId:
      typeof normalized.taskId === "string"
        ? normalized.taskId
        : typeof normalized.task_id === "string"
          ? normalized.task_id
          : undefined,
    artifact: isRecord(normalized.artifact)
      ? {
          parts: normalized.artifact.parts,
        }
      : undefined,
    lastChunk: normalized.lastChunk === true,
  }
}

function extractAssistantTextFromArtifactUpdate(event: ArtifactUpdateEvent): {
  outputChunks: string[]
  outputSnapshot: string | null
  thinkingChunks: string[]
} {
  const parts = event.artifact?.parts
  const fragments = extractTextFromParts(parts)
  const outputChunks: string[] = []
  let outputSnapshot: string | null = null
  const thinkingChunks: string[] = []

  for (const fragment of fragments) {
    const payload = fragment.trim()
    if (payload.length === 0) {
      continue
    }

    try {
      const parsed = JSON.parse(payload)
      if (!isRecord(parsed)) {
        continue
      }

      if (parsed.event_kind === "agent_run_result" && typeof parsed.output === "string") {
        outputSnapshot = parsed.output
        continue
      }

      if (parsed.event_kind === "part_end" && isRecord(parsed.part)) {
        if (parsed.part.part_kind === "text" && typeof parsed.part.content === "string") {
          outputChunks.push(parsed.part.content)
          continue
        }

        if (parsed.part.part_kind === "thinking" && typeof parsed.part.content === "string") {
          thinkingChunks.push(parsed.part.content)
        }
      }
    } catch {
      outputChunks.push(fragment)
    }
  }

  return {
    outputChunks,
    outputSnapshot,
    thinkingChunks,
  }
}

function getConnectionInitialState(): ConnectionStore {
  return {
    state: "idle",
    message: "Not connected",
    client: null,
    connectedUrl: null,
    pendingUrl: null,
    acceptedOutputModes: ["application/json"],
    agentName: null,
  }
}

function createTaskSession(title = DEFAULT_TASK_TITLE): TaskSession {
  const now = Date.now()

  return {
    id: createId("task"),
    title,
    messages: [],
    conversationState: {},
    createdAt: now,
    updatedAt: now,
  }
}

function getUrlChatInitialState(): UrlChatState {
  const firstSession = createTaskSession()

  return {
    activeSessionId: firstSession.id,
    sessions: [firstSession],
    agentName: null,
    lastConnectedAt: null,
  }
}

function getChatInitialState(): ChatStore {
  return {
    byUrl: {},
  }
}

function createResubscribeSignal(controller: AbortController, timeoutMs: number) {
  const timeoutController = new AbortController()
  const timeoutId = globalThis.setTimeout(() => timeoutController.abort(), timeoutMs)

  const onAbort = () => timeoutController.abort()
  controller.signal.addEventListener("abort", onAbort, { once: true })

  return {
    signal: timeoutController.signal,
    release: () => {
      globalThis.clearTimeout(timeoutId)
      controller.signal.removeEventListener("abort", onAbort)
    },
  }
}

function getSessionTitleFromText(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ")
  if (normalized.length === 0) {
    return DEFAULT_TASK_TITLE
  }

  return normalized.length > 36 ? `${normalized.slice(0, 33)}...` : normalized
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`
}

function safeSerialize(value: unknown): string | undefined {
  try {
    const serialized = JSON.stringify(value, null, 2)
    return truncateText(serialized, 4000)
  } catch {
    return undefined
  }
}

function summarizeArtifactParts(parts: unknown): { summary: string; details?: string } {
  if (!Array.isArray(parts) || parts.length === 0) {
    return { summary: "No artifact parts in update." }
  }

  const fragments: string[] = []
  for (const part of parts) {
    if (!isRecord(part) || typeof part.kind !== "string") {
      continue
    }

    if (part.kind === "text") {
      const value = typeof part.text === "string" ? part.text.trim() : ""
      fragments.push(value.length > 0 ? `text: ${truncateText(value, 80)}` : "text: [empty]")
      continue
    }

    if (part.kind === "data") {
      const value = safeSerialize(part.data)
      fragments.push(value ? `data: ${truncateText(value.replace(/\s+/g, " "), 80)}` : "data")
      continue
    }

    if (part.kind === "file") {
      const fileName =
        isRecord(part.file) && typeof part.file.name === "string"
          ? part.file.name
          : "file"
      fragments.push(`file: ${fileName}`)
      continue
    }

    fragments.push(`part: ${part.kind}`)
  }

  if (fragments.length === 0) {
    return { summary: `${parts.length} part(s)` }
  }

  const summary = truncateText(fragments.join(" | "), 180)
  return {
    summary,
    details: `parts: ${parts.length}`,
  }
}

function getFirstDataPart(parts: unknown): Record<string, unknown> | null {
  if (!Array.isArray(parts)) {
    return null
  }

  for (const part of parts) {
    if (isRecord(part) && part.kind === "data" && isRecord(part.data)) {
      return part.data
    }
  }

  return null
}

function summarizeStatusUpdateEvent(event: Record<string, unknown>): string | null {
  if (!isRecord(event.status) || !isRecord(event.status.message)) {
    return null
  }

  const data = getFirstDataPart(event.status.message.parts)
  if (!data || typeof data.type !== "string") {
    return null
  }

  return summarizeToolData(data)
}

function getLatestAgentDataPartFromTask(task: Task): Record<string, unknown> | null {
  const history = Array.isArray(task.history) ? task.history : []

  for (const message of [...history].reverse()) {
    if (!isRecord(message) || message.role !== "agent") {
      continue
    }

    const data = getFirstDataPart(message.parts)
    if (data) {
      return data
    }
  }

  return null
}

function summarizeToolData(data: Record<string, unknown>): string | null {
  if (typeof data.type !== "string") {
    return null
  }

  const toolName = typeof data.toolName === "string" ? data.toolName : "tool"
  if (data.type === "tool-call") {
    return `Calling ${toolName}.`
  }

  if (data.type === "tool-result") {
    return `Received ${toolName} result.`
  }

  if (data.type === "finish-step" && typeof data.finishReason === "string") {
    return `Finished model step: ${data.finishReason}.`
  }

  if (data.type === "finish" && typeof data.finishReason === "string") {
    return `Finished run: ${data.finishReason}.`
  }

  return null
}

function buildTimelineEvent(event: unknown): Omit<MessageTimelineEvent, "id" | "at"> {
  const normalizedEvent = normalizeStreamEvent(event)
  const raw = safeSerialize(normalizedEvent)
  const task = extractTask(normalizedEvent)

  if (task) {
    const state = formatTaskStatus(task.status.state)
    const taskSummary = summarizeToolData(getLatestAgentDataPartFromTask(task) ?? {})
    return {
      kind: "task-update",
      summary: taskSummary ?? `Task ${task.id} is ${state}.`,
      details: task.contextId ? `contextId: ${task.contextId}` : undefined,
      raw,
      rawEvent: normalizedEvent,
    }
  }

  if (isRecord(normalizedEvent) && typeof normalizedEvent.kind === "string") {
    if (normalizedEvent.kind === "status-update") {
      const statusState =
        isRecord(normalizedEvent.status) && typeof normalizedEvent.status.state === "string"
          ? formatTaskStatus(normalizedEvent.status.state)
          : "Unknown"
      const statusSummary = summarizeStatusUpdateEvent(normalizedEvent)
      return {
        kind: "status-update",
        summary: statusSummary ?? `Status changed to ${statusState}.`,
        details:
          typeof normalizedEvent.taskId === "string"
            ? `taskId: ${normalizedEvent.taskId}`
            : undefined,
        raw,
        rawEvent: normalizedEvent,
      }
    }

    if (normalizedEvent.kind === "artifact-update") {
      const parts =
        isRecord(normalizedEvent.artifact) && Array.isArray(normalizedEvent.artifact.parts)
          ? normalizedEvent.artifact.parts
          : []
      const artifactSummary = summarizeArtifactParts(parts)
      return {
        kind: "artifact-update",
        summary: artifactSummary.summary,
        details: artifactSummary.details,
        raw,
        rawEvent: normalizedEvent,
      }
    }

    return {
      kind: normalizedEvent.kind,
      summary: "Received event payload.",
      raw,
      rawEvent: normalizedEvent,
    }
  }

  return {
    kind: "event",
    summary: "Received event payload.",
    raw,
    rawEvent: normalizedEvent,
  }
}

function createStatusEntry(label: string): MessageStatusHistoryEntry {
  return {
    id: createId("status"),
    label,
    at: Date.now(),
  }
}

export function useA2AChat(options: UseA2AChatOptions = {}): UseA2AChatResult {
  const {
    initialUrl = "http://localhost:8000",
    proxyBasePath,
    autoConnect = false,
    persistence,
  } = options
  const queryClient = useQueryClient()
  const [url, setUrl] = React.useState(initialUrl)
  const [taskInput, setTaskInput] = React.useState("")
  const runnerControllersRef = React.useRef(new Map<string, AbortController>())
  const didAutoConnectRef = React.useRef(new Set<string>())

  const baseUrl = React.useMemo(() => normalizeBaseUrl(url), [url])
  const transport = React.useMemo(() => createProxyTransport(proxyBasePath), [proxyBasePath])

  const connectionQuery = useQuery({
    queryKey: connectionKey,
    queryFn: async () => getConnectionInitialState(),
    initialData: getConnectionInitialState,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const chatQuery = useQuery({
    queryKey: chatKey,
    queryFn: async () => getChatInitialState(),
    initialData: getChatInitialState,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const setConnectionStore = React.useCallback(
    (updater: (current: ConnectionStore) => ConnectionStore) => {
      queryClient.setQueryData(connectionKey, (current?: ConnectionStore) =>
        updater(current ?? getConnectionInitialState())
      )
    },
    [queryClient]
  )

  const setChatStore = React.useCallback(
    (updater: (current: ChatStore) => ChatStore) => {
      queryClient.setQueryData(chatKey, (current?: ChatStore) => updater(current ?? getChatInitialState()))
    },
    [queryClient]
  )

  const ensureUrlChatState = React.useCallback(
    (urlKey: string) => {
      setChatStore((current) => {
        if (current.byUrl[urlKey]) {
          return current
        }

        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: getUrlChatInitialState(),
          },
        }
      })
    },
    [setChatStore]
  )

  const updateTaskSession = React.useCallback(
    (urlKey: string, sessionId: string, updater: (current: TaskSession) => TaskSession) => {
      setChatStore((current) => {
        const urlState = current.byUrl[urlKey]
        if (!urlState) {
          return current
        }

        let didUpdate = false
        const nextSessions = urlState.sessions.map((session) => {
          if (session.id !== sessionId) {
            return session
          }

          didUpdate = true
          const updatedSession = updater(session)
          if (updatedSession.updatedAt === session.updatedAt) {
            return {
              ...updatedSession,
              updatedAt: Date.now(),
            }
          }

          return updatedSession
        })

        if (!didUpdate) {
          return current
        }

        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: {
              ...urlState,
              sessions: nextSessions,
            },
          },
        }
      })
    },
    [setChatStore]
  )

  const hydratePersistedSessions = React.useCallback(
    async (urlKey: string) => {
      if (!persistence) {
        return
      }

      const persistedSessions = await persistence.loadSessions({ url: urlKey })
      if (persistedSessions.length === 0) {
        ensureUrlChatState(urlKey)
        return
      }

      setChatStore((current) => {
        const urlState = current.byUrl[urlKey] ?? getUrlChatInitialState()
        const existingById = new Map(urlState.sessions.map((session) => [session.id, session]))
        const nextSessions = persistedSessions.map((session) => ({
          ...(existingById.get(session.id) ?? {}),
          ...session,
        }))
        const activeSessionId = nextSessions.some((session) => session.id === urlState.activeSessionId)
          ? urlState.activeSessionId
          : nextSessions[0]?.id ?? urlState.activeSessionId

        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: {
              ...urlState,
              activeSessionId,
              sessions: nextSessions,
            },
          },
        }
      })
    },
    [ensureUrlChatState, persistence, setChatStore]
  )

  const updateAssistantMessage = React.useCallback(
    (
      urlKey: string,
      sessionId: string,
      messageId: string,
      updater: (current: Message) => Message
    ) => {
      updateTaskSession(urlKey, sessionId, (currentSession) => ({
        ...currentSession,
        messages: currentSession.messages.map((item) => {
          if (item.id !== messageId || item.role !== "assistant") {
            return item
          }

          return updater(item)
        }),
      }))
    },
    [updateTaskSession]
  )

  const setAssistantStatus = React.useCallback(
    (
      urlKey: string,
      sessionId: string,
      messageId: string,
      nextStatus: string,
      isWorking: boolean
    ) => {
      updateAssistantMessage(urlKey, sessionId, messageId, (currentMessage) => {
        const statusHistory = currentMessage.statusHistory ?? []
        const lastStatus = statusHistory.at(-1)?.label
        const nextStatusHistory =
          lastStatus === nextStatus
            ? statusHistory
            : [...statusHistory, createStatusEntry(nextStatus)]

        return {
          ...currentMessage,
          status: nextStatus,
          isWorking,
          statusHistory: nextStatusHistory,
        }
      })
    },
    [updateAssistantMessage]
  )

  const appendAssistantEvent = React.useCallback(
    (
      urlKey: string,
      sessionId: string,
      messageId: string,
      event: Omit<MessageTimelineEvent, "id" | "at">
    ) => {
      updateAssistantMessage(urlKey, sessionId, messageId, (currentMessage) => ({
        ...currentMessage,
        events: [
          ...(currentMessage.events ?? []),
          {
            ...event,
            id: createId("evt"),
            at: Date.now(),
          },
        ],
      }))
    },
    [updateAssistantMessage]
  )

  const hydrateTaskOutput = React.useCallback(
    async (
      client: A2AClient,
      urlKey: string,
      sessionId: string,
      assistantMessageId: string,
      taskId: string
    ): Promise<Task | null> => {
      try {
        const snapshot = await Effect.runPromise(getTaskById(client, taskId))
        const snapshotText = getTaskText(snapshot)

        appendAssistantEvent(urlKey, sessionId, assistantMessageId, {
          kind: "task-snapshot",
          summary: "Fetched final task snapshot.",
          raw: safeSerialize(snapshot),
          rawEvent: snapshot,
        })

        if (snapshotText.length > 0) {
          updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
            ...currentMessage,
            text: snapshotText,
          }))
        }
        return snapshot
      } catch (error) {
        appendAssistantEvent(urlKey, sessionId, assistantMessageId, {
          kind: "task-snapshot-error",
          summary: getErrorMessage(error, "Could not fetch final task snapshot."),
        })
        return null
      }
    },
    [appendAssistantEvent, updateAssistantMessage]
  )

  const processTaskStreamEvent = React.useCallback(
    async (
      client: A2AClient,
      urlKey: string,
      sessionId: string,
      assistantMessageId: string,
      currentTask: Task | null,
      event: unknown
    ): Promise<TaskStreamProcessResult> => {
      const artifactUpdate = getArtifactUpdateEvent(event)
      if (!artifactUpdate) {
        appendAssistantEvent(urlKey, sessionId, assistantMessageId, buildTimelineEvent(event))
      }

      const taskEvent = extractTask(normalizeStreamEvent(event))
      if (taskEvent) {
        updateTaskSession(urlKey, sessionId, (currentSession) => ({
          ...currentSession,
          conversationState: {
            contextId: taskEvent.contextId,
            taskId: taskEvent.id,
          },
        }))
        updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
          ...currentMessage,
          text: getTaskText(taskEvent),
        }))
        setAssistantStatus(
          urlKey,
          sessionId,
          assistantMessageId,
          formatTaskStatus(taskEvent.status.state),
          !isTerminalTask(taskEvent)
        )
        if (isTerminalTask(taskEvent)) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            taskEvent.id
          )
          return { task: snapshot ?? taskEvent, done: true }
        }
        return { task: taskEvent, done: false }
      }

      if (!currentTask) {
        return { task: null, done: false }
      }

      if (artifactUpdate && artifactUpdate.taskId === currentTask.id) {
        const { outputChunks, outputSnapshot, thinkingChunks } =
          extractAssistantTextFromArtifactUpdate(artifactUpdate)
        if (outputSnapshot !== null || outputChunks.length > 0 || thinkingChunks.length > 0) {
          updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => {
            const nextText = outputSnapshot ?? `${currentMessage.text}${outputChunks.join("")}`
            const nextThinkingText = `${currentMessage.thinkingText ?? ""}${thinkingChunks.join("")}`

            return {
              ...currentMessage,
              text: nextText,
              thinkingText: nextThinkingText.length > 0 ? nextThinkingText : currentMessage.thinkingText,
            }
          })
        }

        if (artifactUpdate.lastChunk) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            currentTask.id
          )
          if (snapshot) {
            setAssistantStatus(
              urlKey,
              sessionId,
              assistantMessageId,
              formatTaskStatus(snapshot.status.state),
              !isTerminalTask(snapshot)
            )
            return { task: snapshot, done: isTerminalTask(snapshot) }
          }
        }

        return { task: currentTask, done: false }
      }

      const statusUpdate = getStatusUpdateEvent(event)
      if (statusUpdate && statusUpdate.taskId === currentTask.id) {
        const nextTask: Task = {
          ...currentTask,
          status: statusUpdate.status,
        }
        updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
          ...currentMessage,
          text: getTaskText(nextTask),
        }))
        setAssistantStatus(
          urlKey,
          sessionId,
          assistantMessageId,
          formatTaskStatus(nextTask.status.state),
          !isTerminalTask(nextTask)
        )
        if (isTerminalTask(nextTask)) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            nextTask.id
          )
          return { task: snapshot ?? nextTask, done: true }
        }
        return { task: nextTask, done: false }
      }

      return { task: currentTask, done: false }
    },
    [
      appendAssistantEvent,
      hydrateTaskOutput,
      setAssistantStatus,
      updateAssistantMessage,
      updateTaskSession,
    ]
  )

  const startTaskResubscribeLoop = React.useCallback(
    (
      client: A2AClient,
      urlKey: string,
      sessionId: string,
      initialTask: Task,
      assistantMessageId: string
    ) => {
      const controllerKey = `${urlKey}::${initialTask.id}`
      const existing = runnerControllersRef.current.get(controllerKey)
      if (existing) {
        existing.abort()
      }

      const controller = new AbortController()
      runnerControllersRef.current.set(controllerKey, controller)

      void (async () => {
        let currentTask = initialTask

        for (let attempt = 0; attempt < 120; attempt += 1) {
          if (controller.signal.aborted || isTerminalTask(currentTask)) {
            break
          }

          const { signal, release } = createResubscribeSignal(controller, 3000)

          try {
            const stream = await Effect.runPromise(resubscribeToTask(client, currentTask.id, signal))

            for await (const event of stream) {
              if (controller.signal.aborted) {
                break
              }

              const result = await processTaskStreamEvent(
                client,
                urlKey,
                sessionId,
                assistantMessageId,
                currentTask,
                event
              )
              if (result.task) {
                currentTask = result.task
              }
              if (result.done) {
                break
              }
            }
          } catch {
            // Re-subscribe can timeout when no event is emitted in this window.
          } finally {
            release()
          }

          if (controller.signal.aborted || isTerminalTask(currentTask)) {
            break
          }

          await Effect.runPromise(Effect.sleep(600))
        }

        if (!controller.signal.aborted && !isTerminalTask(currentTask)) {
          setAssistantStatus(urlKey, sessionId, assistantMessageId, "Waiting For Events", true)
        }

        runnerControllersRef.current.delete(controllerKey)
      })()
    },
    [processTaskStreamEvent, setAssistantStatus]
  )

  React.useEffect(() => {
    return () => {
      for (const controller of runnerControllersRef.current.values()) {
        controller.abort()
      }
      runnerControllersRef.current.clear()
    }
  }, [])

  const connectMutation = useMutation({
    mutationFn: async (targetUrl: string) => Effect.runPromise(connectJsonRpc(targetUrl, transport)),
    onMutate: (targetUrl) => {
      ensureUrlChatState(targetUrl)
      setConnectionStore((current) => ({
        ...current,
        state: "connecting",
        message: `Checking ${targetUrl}...`,
        client: null,
        connectedUrl: null,
        pendingUrl: targetUrl,
        acceptedOutputModes: ["application/json"],
        agentName: null,
      }))
    },
    onSuccess: ({ client, endpoint, acceptedOutputModes, agentName }, targetUrl) => {
      setChatStore((current) => {
        const urlState = current.byUrl[targetUrl] ?? getUrlChatInitialState()

        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [targetUrl]: {
              ...urlState,
              agentName: agentName && agentName.trim().length > 0 ? agentName.trim() : null,
              lastConnectedAt: Date.now(),
            },
          },
        }
      })

      setConnectionStore((current) => ({
        ...current,
        state: "connected",
        message: `Connected via JSONRPC (${endpoint})`,
        client,
        connectedUrl: targetUrl,
        pendingUrl: null,
        acceptedOutputModes:
          acceptedOutputModes.length > 0 ? acceptedOutputModes : ["application/json"],
        agentName,
      }))

      void hydratePersistedSessions(targetUrl)
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Could not connect to the server")
      setConnectionStore((current) => ({
        ...current,
        state: "error",
        message,
        client: null,
        connectedUrl: null,
        pendingUrl: current.pendingUrl,
        agentName: null,
      }))
    },
  })

  const sendTaskMutation = useMutation<void, Error, SendTaskVariables>({
    mutationFn: async (variables) => {
      const connection = queryClient.getQueryData<ConnectionStore>(connectionKey)
      if (
        !connection ||
        connection.state !== "connected" ||
        !connection.client ||
        connection.connectedUrl !== variables.urlKey
      ) {
        throw new Error("Not connected")
      }

      const chatStore = queryClient.getQueryData<ChatStore>(chatKey) ?? getChatInitialState()
      const urlState = chatStore.byUrl[variables.urlKey]
      const targetSession = urlState?.sessions.find((session) => session.id === variables.taskSessionId)
      if (!targetSession) {
        throw new Error("Task session not found")
      }

      const streamController = new AbortController()
      const streamControllerKey = `${variables.urlKey}::${variables.assistantMessageId}`
      runnerControllersRef.current.set(streamControllerKey, streamController)

      let currentTask: Task | null = null
      let directResponseText = ""

      try {
        const payload = buildA2AMessage(variables.taskText, targetSession.conversationState)
        const stream = await Effect.runPromise(
          sendTaskMessageStream(
            connection.client,
            {
              message: payload,
              configuration: {
                acceptedOutputModes: connection.acceptedOutputModes,
              },
            },
            streamController.signal
          )
        )

        for await (const event of stream) {
          if (streamController.signal.aborted) {
            break
          }

          const eventText = extractResponseMessageText(event)
          if (eventText.length > 0) {
            directResponseText = eventText
          }

          const result = await processTaskStreamEvent(
            connection.client,
            variables.urlKey,
            variables.taskSessionId,
            variables.assistantMessageId,
            currentTask,
            event
          )
          currentTask = result.task
          if (currentTask && runnerControllersRef.current.get(streamControllerKey) === streamController) {
            runnerControllersRef.current.delete(streamControllerKey)
            runnerControllersRef.current.set(`${variables.urlKey}::${currentTask.id}`, streamController)
          }
          if (result.done) {
            break
          }
        }
      } catch (error) {
        if (!streamController.signal.aborted && currentTask && !isTerminalTask(currentTask)) {
          startTaskResubscribeLoop(
            connection.client,
            variables.urlKey,
            variables.taskSessionId,
            currentTask,
            variables.assistantMessageId
          )
          return
        }
        throw error
      } finally {
        if (runnerControllersRef.current.get(streamControllerKey) === streamController) {
          runnerControllersRef.current.delete(streamControllerKey)
        }
        if (currentTask && runnerControllersRef.current.get(`${variables.urlKey}::${currentTask.id}`) === streamController) {
          runnerControllersRef.current.delete(`${variables.urlKey}::${currentTask.id}`)
        }
      }

      if (currentTask) {
        return
      }

      if (directResponseText.length > 0) {
        updateAssistantMessage(
          variables.urlKey,
          variables.taskSessionId,
          variables.assistantMessageId,
          (currentMessage) => ({
            ...currentMessage,
            text: directResponseText,
          })
        )
        setAssistantStatus(
          variables.urlKey,
          variables.taskSessionId,
          variables.assistantMessageId,
          "Completed",
          false
        )
        return
      }

      throw new Error("Task stream ended without returning a task or message.")
    },
    onSuccess: async (_result, variables) => {
      await hydratePersistedSessions(variables.urlKey)
    },
    onMutate: ({ taskText, assistantMessageId, urlKey, taskSessionId }) => {
      updateTaskSession(urlKey, taskSessionId, (currentSession) => ({
        ...currentSession,
        title:
          currentSession.title === DEFAULT_TASK_TITLE && currentSession.messages.length === 0
            ? getSessionTitleFromText(taskText)
            : currentSession.title,
        messages: [
          ...currentSession.messages,
          { id: createId("msg"), role: "user", text: taskText },
          {
            id: assistantMessageId,
            role: "assistant",
            text: "",
            status: "Sending Task",
            isWorking: true,
            statusHistory: [createStatusEntry("Sending Task")],
            events: [],
          },
        ],
      }))
      setTaskInput("")
    },
    onError: (error, variables) => {
      const message = getErrorMessage(
        error,
        "Failed to send task or read task updates from the server."
      )
      updateAssistantMessage(
        variables.urlKey,
        variables.taskSessionId,
        variables.assistantMessageId,
        (currentMessage) => ({
          ...currentMessage,
          text: message,
        })
      )
      setAssistantStatus(
        variables.urlKey,
        variables.taskSessionId,
        variables.assistantMessageId,
        "Failed",
        false
      )
    },
  })

  const activeUrlState = chatQuery.data.byUrl[baseUrl] ?? null
  const recentAgents = React.useMemo(
    () =>
      Object.entries(chatQuery.data.byUrl)
        .map(([connectedUrl, state]) => ({
          url: connectedUrl,
          agentName: state.agentName,
          lastConnectedAt: state.lastConnectedAt,
        }))
        .filter((entry) => entry.lastConnectedAt !== null)
        .sort((a, b) => (b.lastConnectedAt ?? 0) - (a.lastConnectedAt ?? 0)),
    [chatQuery.data.byUrl]
  )
  const activeTaskSession = activeUrlState
    ? activeUrlState.sessions.find((session) => session.id === activeUrlState.activeSessionId) ??
      activeUrlState.sessions[0] ??
      null
    : null

  const taskSessions = React.useMemo(
    () =>
      [...(activeUrlState?.sessions ?? [])]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((session) => ({
          id: session.id,
          title: session.title,
          updatedAt: session.updatedAt,
        })),
    [activeUrlState?.sessions]
  )

  const handleConnect = React.useCallback(() => {
    connectMutation.mutate(baseUrl)
  }, [baseUrl, connectMutation])

  const handleSelectRecentAgent = React.useCallback(
    (agentUrl: string) => {
      setUrl(agentUrl)
      ensureUrlChatState(agentUrl)
    },
    [ensureUrlChatState]
  )

  React.useEffect(() => {
    if (!autoConnect || connectMutation.isPending || didAutoConnectRef.current.has(baseUrl)) {
      return
    }

    const connection = connectionQuery.data
    if (connection.state === "connected" && connection.connectedUrl === baseUrl) {
      return
    }

    didAutoConnectRef.current.add(baseUrl)
    connectMutation.mutate(baseUrl)
  }, [autoConnect, baseUrl, connectMutation, connectionQuery.data])

  React.useEffect(() => {
    void hydratePersistedSessions(baseUrl)
  }, [baseUrl, hydratePersistedSessions])

  const handleSubmitTask = React.useCallback((taskTextOverride?: string) => {
    const taskText = (taskTextOverride ?? taskInput).trim()
    const connection = connectionQuery.data
    if (
      taskText.length === 0 ||
      sendTaskMutation.isPending ||
      !activeTaskSession ||
      connection.state !== "connected" ||
      connection.connectedUrl !== baseUrl ||
      !connection.client
    ) {
      return
    }

    sendTaskMutation.mutate({
      taskText,
      assistantMessageId: createId("msg"),
      urlKey: baseUrl,
      taskSessionId: activeTaskSession.id,
    })
  }, [activeTaskSession, baseUrl, connectionQuery.data, sendTaskMutation, taskInput])

  const handleCancelTask = React.useCallback(() => {
    const connection = connectionQuery.data
    if (
      !activeTaskSession ||
      connection.state !== "connected" ||
      connection.connectedUrl !== baseUrl ||
      !connection.client
    ) {
      return
    }

    const taskId = activeTaskSession.conversationState.taskId
    const workingAssistantMessage = [...activeTaskSession.messages]
      .reverse()
      .find((message) => message.role === "assistant" && message.isWorking)

    if (!workingAssistantMessage) {
      return
    }

    const controllerKey = taskId
      ? `${baseUrl}::${taskId}`
      : `${baseUrl}::${workingAssistantMessage.id}`
    runnerControllersRef.current.get(controllerKey)?.abort()

    if (!taskId) {
      setAssistantStatus(baseUrl, activeTaskSession.id, workingAssistantMessage.id, "Canceled", false)
      return
    }

    void Effect.runPromise(cancelTaskById(connection.client, taskId))
      .then((task) => {
        updateAssistantMessage(baseUrl, activeTaskSession.id, workingAssistantMessage.id, (currentMessage) => ({
          ...currentMessage,
          text: getTaskText(task),
        }))
        setAssistantStatus(
          baseUrl,
          activeTaskSession.id,
          workingAssistantMessage.id,
          formatTaskStatus(task.status.state),
          !isTerminalTask(task)
        )
      })
      .catch((error) => {
        updateAssistantMessage(baseUrl, activeTaskSession.id, workingAssistantMessage.id, (currentMessage) => ({
          ...currentMessage,
          text: getErrorMessage(error, "Could not cancel task on the A2A server."),
        }))
        setAssistantStatus(baseUrl, activeTaskSession.id, workingAssistantMessage.id, "Cancel Failed", false)
      })
  }, [activeTaskSession, baseUrl, connectionQuery.data, setAssistantStatus, updateAssistantMessage])

  const handleCreateTaskSession = React.useCallback(() => {
    setChatStore((current) => {
      const urlState = current.byUrl[baseUrl]
      if (!urlState) {
        return current
      }

      const nextSession = createTaskSession()

      return {
        ...current,
        byUrl: {
          ...current.byUrl,
          [baseUrl]: {
            ...urlState,
            activeSessionId: nextSession.id,
            sessions: [...urlState.sessions, nextSession],
          },
        },
      }
    })
  }, [baseUrl, setChatStore])

  const handleSelectTaskSession = React.useCallback(
    (sessionId: string) => {
      setChatStore((current) => {
        const urlState = current.byUrl[baseUrl]
        if (!urlState || !urlState.sessions.some((session) => session.id === sessionId)) {
          return current
        }

        if (urlState.activeSessionId === sessionId) {
          return current
        }

        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [baseUrl]: {
              ...urlState,
              activeSessionId: sessionId,
            },
          },
        }
      })
    },
    [baseUrl, setChatStore]
  )

  const handleDeleteTaskSession = React.useCallback(
    (sessionId: string) => {
      const deletePersistedSession = persistence?.deleteSession
      if (deletePersistedSession) {
        void deletePersistedSession({ url: baseUrl, sessionId })
      }

      setChatStore((current) => {
        const urlState = current.byUrl[baseUrl]
        if (!urlState || !urlState.sessions.some((session) => session.id === sessionId)) {
          return current
        }

        const remainingSessions = urlState.sessions.filter((session) => session.id !== sessionId)
        if (remainingSessions.length === 0) {
          const nextSession = createTaskSession()
          return {
            ...current,
            byUrl: {
              ...current.byUrl,
              [baseUrl]: {
                ...urlState,
                activeSessionId: nextSession.id,
                sessions: [nextSession],
              },
            },
          }
        }

        const nextActiveSessionId =
          urlState.activeSessionId === sessionId
            ? [...remainingSessions].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? urlState.activeSessionId
            : urlState.activeSessionId

        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [baseUrl]: {
              ...urlState,
              activeSessionId: nextActiveSessionId,
              sessions: remainingSessions,
            },
          },
        }
      })
    },
    [baseUrl, persistence, setChatStore]
  )

  const activeConnection = connectionQuery.data
  const isConnectedToCurrentUrl =
    activeConnection.state === "connected" && activeConnection.connectedUrl === baseUrl
  const isConnectingCurrentUrl =
    activeConnection.state === "connecting" && activeConnection.pendingUrl === baseUrl
  const isErrorForCurrentUrl =
    activeConnection.state === "error" && activeConnection.pendingUrl === baseUrl
  const connectionState: ConnectionState = isConnectedToCurrentUrl
    ? "connected"
    : isConnectingCurrentUrl
      ? "connecting"
      : isErrorForCurrentUrl
        ? "error"
        : "idle"
  const connectionMessage =
    connectionState === "idle" ? "Not connected" : activeConnection.message

  return {
    url,
    setUrl,
    connectionState,
    connectionMessage,
    agentName: isConnectedToCurrentUrl ? activeConnection.agentName : null,
    taskInput,
    setTaskInput,
    isSending: sendTaskMutation.isPending,
    messages: activeTaskSession?.messages ?? [],
    recentAgents,
    taskSessions,
    activeTaskSessionId: activeTaskSession?.id ?? null,
    handleConnect,
    handleSelectRecentAgent,
    handleSubmitTask,
    handleCancelTask,
    handleCreateTaskSession,
    handleSelectTaskSession,
    handleDeleteTaskSession,
  }
}
