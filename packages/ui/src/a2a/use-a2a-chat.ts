import React from "react"
import { Effect } from "effect"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Task } from "@a2a-js/sdk"

import type { Message } from "../components/shared/message-box"
import {
  buildA2AMessage,
  createId,
  extractTask,
  extractTextFromParts,
  getTaskText,
  normalizeBaseUrl,
} from "./helpers"
import { createProxyTransport } from "./proxy"
import { connectJsonRpc, resubscribeToTask, sendTaskMessage } from "./service"
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

type UrlChatState = {
  activeSessionId: string
  sessions: TaskSession[]
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
  proxyBasePath?: string
  autoConnect?: boolean
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

export function useA2AChat(options: UseA2AChatOptions = {}) {
  const {
    initialUrl = "http://localhost:8000",
    proxyBasePath,
    autoConnect = false,
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

  React.useEffect(() => {
    ensureUrlChatState(baseUrl)
  }, [baseUrl, ensureUrlChatState])

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
        const streamNotes: string[] = []
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

              const taskEvent = extractTask(event)
              if (taskEvent) {
                currentTask = taskEvent
                updateTaskSession(urlKey, sessionId, (currentSession) => ({
                  ...currentSession,
                  conversationState: {
                    contextId: taskEvent.contextId,
                    taskId: taskEvent.id,
                  },
                }))
                updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
                  ...currentMessage,
                  text: getTaskText(currentTask, streamNotes),
                  status: formatTaskStatus(currentTask.status.state),
                  isWorking: !isTerminalTask(currentTask),
                }))
                if (isTerminalTask(currentTask)) {
                  break
                }
                continue
              }

              if (event.kind === "artifact-update" && event.taskId === currentTask.id) {
                const artifactNotes = extractTextFromParts(event.artifact.parts)
                if (artifactNotes.length > 0) {
                  streamNotes.push(...artifactNotes)
                  updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
                    ...currentMessage,
                    text: getTaskText(currentTask, streamNotes),
                    status: formatTaskStatus(currentTask.status.state),
                    isWorking: !isTerminalTask(currentTask),
                  }))
                }
                continue
              }

              if (event.kind === "status-update" && event.taskId === currentTask.id) {
                currentTask = {
                  ...currentTask,
                  status: event.status,
                }
                updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
                  ...currentMessage,
                  text: getTaskText(currentTask, streamNotes),
                  status: formatTaskStatus(currentTask.status.state),
                  isWorking: !isTerminalTask(currentTask),
                }))
                if (isTerminalTask(currentTask)) {
                  break
                }
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
          updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
            ...currentMessage,
            status: "Waiting For Events",
            isWorking: true,
          }))
        }

        runnerControllersRef.current.delete(controllerKey)
      })()
    },
    [updateAssistantMessage, updateTaskSession]
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

  const sendTaskMutation = useMutation({
    mutationFn: async (variables: {
      taskText: string
      assistantMessageId: string
      urlKey: string
      taskSessionId: string
    }) => {
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

      const payload = buildA2AMessage(variables.taskText, targetSession.conversationState)
      const response = await Effect.runPromise(
        sendTaskMessage(connection.client, {
          message: payload,
          configuration: {
            acceptedOutputModes: connection.acceptedOutputModes,
            blocking: false,
          },
        })
      )

      const parsedTask = extractTask(response)
      const initialTask = parsedTask ?? (response.kind === "task" ? response : null)

      return {
        response,
        initialTask,
        assistantMessageId: variables.assistantMessageId,
        client: connection.client,
        urlKey: variables.urlKey,
        taskSessionId: variables.taskSessionId,
      }
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
          },
        ],
      }))
      setTaskInput("")
    },
    onSuccess: ({ response, initialTask, assistantMessageId, client, urlKey, taskSessionId }) => {
      if (!initialTask) {
        if (response.kind !== "task") {
          const directText = extractTextFromParts(response.parts).join("\n")
          const fallbackText =
            directText.length > 0
              ? `Expected a task response but got a direct message:\n${directText}`
              : "Expected a task response but got a direct message."
          updateAssistantMessage(urlKey, taskSessionId, assistantMessageId, (currentMessage) => ({
            ...currentMessage,
            text: fallbackText,
            status: "Completed",
            isWorking: false,
          }))
          return
        }

        updateAssistantMessage(urlKey, taskSessionId, assistantMessageId, (currentMessage) => ({
          ...currentMessage,
          text: "Task sent, but no task payload could be parsed from the response.",
          status: "Failed",
          isWorking: false,
        }))
        return
      }

      updateAssistantMessage(urlKey, taskSessionId, assistantMessageId, (currentMessage) => ({
        ...currentMessage,
        status: formatTaskStatus(initialTask.status.state),
        isWorking: !isTerminalTask(initialTask),
      }))

      updateTaskSession(urlKey, taskSessionId, (currentSession) => ({
        ...currentSession,
        conversationState: {
          contextId: initialTask.contextId,
          taskId: initialTask.id,
        },
      }))

      startTaskResubscribeLoop(client, urlKey, taskSessionId, initialTask, assistantMessageId)
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
          status: "Failed",
          isWorking: false,
        })
      )
    },
  })

  const activeUrlState = chatQuery.data.byUrl[baseUrl] ?? getUrlChatInitialState()
  const activeTaskSession =
    activeUrlState.sessions.find((session) => session.id === activeUrlState.activeSessionId) ??
    activeUrlState.sessions[0] ??
    null

  const taskSessions = React.useMemo(
    () =>
      [...activeUrlState.sessions]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((session) => ({
          id: session.id,
          title: session.title,
          updatedAt: session.updatedAt,
        })),
    [activeUrlState.sessions]
  )

  const handleConnect = React.useCallback(() => {
    connectMutation.mutate(baseUrl)
  }, [baseUrl, connectMutation])

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

  const handleSubmitTask = React.useCallback(() => {
    const taskText = taskInput.trim()
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

  const handleCreateTaskSession = React.useCallback(() => {
    setChatStore((current) => {
      const urlState = current.byUrl[baseUrl] ?? getUrlChatInitialState()
      const nextSession = createTaskSession()

      return {
        ...current,
        byUrl: {
          ...current.byUrl,
          [baseUrl]: {
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
    taskSessions,
    activeTaskSessionId: activeTaskSession?.id ?? null,
    handleConnect,
    handleSubmitTask,
    handleCreateTaskSession,
    handleSelectTaskSession,
  }
}
