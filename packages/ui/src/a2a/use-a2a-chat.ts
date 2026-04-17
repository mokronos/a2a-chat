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
  acceptedOutputModes: string[]
  conversationState: A2AConversationState
  agentName: string | null
}

type ChatStore = {
  messages: Message[]
}

const connectionKey = ["a2a", "connection"] as const
const chatKey = ["a2a", "chat"] as const
const TERMINAL_STATES = new Set(["completed", "failed", "canceled", "rejected"])

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
    acceptedOutputModes: ["application/json"],
    conversationState: {},
    agentName: null,
  }
}

function getChatInitialState(): ChatStore {
  return {
    messages: [],
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
  const didAutoConnectRef = React.useRef(false)

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
      queryClient.setQueryData(chatKey, (current?: ChatStore) =>
        updater(current ?? getChatInitialState())
      )
    },
    [queryClient]
  )

  const updateAssistantMessage = React.useCallback(
    (messageId: string, updater: (current: Message) => Message) => {
      setChatStore((current) => ({
        ...current,
        messages: current.messages.map((item) => {
          if (item.id !== messageId || item.role !== "assistant") {
            return item
          }

          return updater(item)
        }),
      }))
    },
    [setChatStore]
  )

  const startTaskResubscribeLoop = React.useCallback(
    (client: A2AClient, initialTask: Task, assistantMessageId: string) => {
      const existing = runnerControllersRef.current.get(initialTask.id)
      if (existing) {
        existing.abort()
      }

      const controller = new AbortController()
      runnerControllersRef.current.set(initialTask.id, controller)

      void (async () => {
        const streamNotes: string[] = []
        let currentTask = initialTask

        for (let attempt = 0; attempt < 120; attempt += 1) {
          if (controller.signal.aborted || isTerminalTask(currentTask)) {
            break
          }

          const { signal, release } = createResubscribeSignal(controller, 3000)

          try {
            const stream = await Effect.runPromise(
              resubscribeToTask(client, currentTask.id, signal)
            )

            for await (const event of stream) {
              if (controller.signal.aborted) {
                break
              }

              const taskEvent = extractTask(event)
              if (taskEvent) {
                currentTask = taskEvent
                setConnectionStore((current) => ({
                  ...current,
                  conversationState: {
                    contextId: taskEvent.contextId,
                    taskId: taskEvent.id,
                  },
                }))
                updateAssistantMessage(assistantMessageId, (current) => ({
                  ...current,
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
                  updateAssistantMessage(assistantMessageId, (current) => ({
                    ...current,
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
                updateAssistantMessage(assistantMessageId, (current) => ({
                  ...current,
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
          updateAssistantMessage(assistantMessageId, (current) => ({
            ...current,
            status: "Waiting For Events",
            isWorking: true,
          }))
        }

        runnerControllersRef.current.delete(initialTask.id)
      })()
    },
    [setConnectionStore, updateAssistantMessage]
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
    mutationFn: async (targetUrl: string) =>
      Effect.runPromise(connectJsonRpc(targetUrl, transport)),
    onMutate: (targetUrl) => {
      setConnectionStore((current) => ({
        ...current,
        state: "connecting",
        message: `Checking ${targetUrl}...`,
        client: null,
        acceptedOutputModes: ["application/json"],
        conversationState: {},
        agentName: null,
      }))
    },
    onSuccess: ({ client, endpoint, acceptedOutputModes, agentName }) => {
      setConnectionStore((current) => ({
        ...current,
        state: "connected",
        message: `Connected via JSONRPC (${endpoint})`,
        client,
        acceptedOutputModes:
          acceptedOutputModes.length > 0 ? acceptedOutputModes : ["application/json"],
        conversationState: {},
        agentName,
      }))
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Could not connect to the server")
      setConnectionStore((current) => ({
        ...current,
        state: "error",
        message,
      }))
    },
  })

  const sendTaskMutation = useMutation({
    mutationFn: async (variables: { taskText: string; assistantMessageId: string }) => {
      const connection = queryClient.getQueryData<ConnectionStore>(connectionKey)
      if (!connection || connection.state !== "connected" || !connection.client) {
        throw new Error("Not connected")
      }

      const payload = buildA2AMessage(variables.taskText, connection.conversationState)
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
      }
    },
    onMutate: ({ taskText, assistantMessageId }) => {
      setChatStore((current) => ({
        ...current,
        messages: [
          ...current.messages,
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
    onSuccess: ({ response, initialTask, assistantMessageId, client }) => {
      if (!initialTask) {
        if (response.kind !== "task") {
          const directText = extractTextFromParts(response.parts).join("\n")
          const fallbackText =
            directText.length > 0
              ? `Expected a task response but got a direct message:\n${directText}`
              : "Expected a task response but got a direct message."
          updateAssistantMessage(assistantMessageId, (current) => ({
            ...current,
            text: fallbackText,
            status: "Completed",
            isWorking: false,
          }))
          return
        }

        updateAssistantMessage(assistantMessageId, (current) => ({
          ...current,
          text: "Task sent, but no task payload could be parsed from the response.",
          status: "Failed",
          isWorking: false,
        }))
        return
      }

      updateAssistantMessage(assistantMessageId, (current) => ({
        ...current,
        status: formatTaskStatus(initialTask.status.state),
        isWorking: !isTerminalTask(initialTask),
      }))

      setConnectionStore((current) => ({
        ...current,
        conversationState: {
          contextId: initialTask.contextId,
          taskId: initialTask.id,
        },
      }))

      startTaskResubscribeLoop(client, initialTask, assistantMessageId)
    },
    onError: (error, variables) => {
      const message = getErrorMessage(error, "Failed to send task or read task updates from the server.")
      updateAssistantMessage(variables.assistantMessageId, (current) => ({
        ...current,
        text: message,
        status: "Failed",
        isWorking: false,
      }))
    },
  })

  const handleConnect = React.useCallback(() => {
    connectMutation.mutate(baseUrl)
  }, [baseUrl, connectMutation])

  React.useEffect(() => {
    if (!autoConnect || connectMutation.isPending || didAutoConnectRef.current) {
      return
    }

    const connection = connectionQuery.data
    if (connection.state === "connected" || connection.state === "connecting") {
      return
    }

    didAutoConnectRef.current = true
    connectMutation.mutate(baseUrl)
  }, [autoConnect, baseUrl, connectMutation, connectionQuery.data])

  const handleSubmitTask = React.useCallback(() => {
    const taskText = taskInput.trim()
    const connection = connectionQuery.data
    if (
      taskText.length === 0 ||
      sendTaskMutation.isPending ||
      connection.state !== "connected" ||
      !connection.client
    ) {
      return
    }

    sendTaskMutation.mutate({
      taskText,
      assistantMessageId: createId("msg"),
    })
  }, [connectionQuery.data, sendTaskMutation, taskInput])

  const isSending = sendTaskMutation.isPending

  return {
    url,
    setUrl,
    connectionState: connectionQuery.data.state,
    connectionMessage: connectionQuery.data.message,
    agentName: connectionQuery.data.agentName,
    taskInput,
    setTaskInput,
    isSending,
    messages: chatQuery.data.messages,
    handleConnect,
    handleSubmitTask,
  }
}
