import { Effect } from "effect"
import type { MessageSendParams } from "@a2a-js/sdk"

import { createJsonRpcClient } from "./helpers"
import type { A2AClient, A2AProxyTransport } from "./types"

export const connectJsonRpc = (baseUrl: string, transport: A2AProxyTransport) =>
  Effect.tryPromise({
    try: () => createJsonRpcClient(baseUrl, transport),
    catch: (cause) =>
      cause instanceof Error ? cause : new Error("Could not connect to the A2A server"),
  })

export const sendTaskMessage = (client: A2AClient, params: MessageSendParams) =>
  Effect.tryPromise({
    try: () => client.sendMessage(params),
    catch: (cause) =>
      cause instanceof Error ? cause : new Error("Could not send message to A2A server"),
  })

export const resubscribeToTask = (
  client: A2AClient,
  taskId: string,
  signal: AbortSignal
) =>
  Effect.sync(() => client.resubscribeTask({ id: taskId }, { signal }))

export const getTaskById = (client: A2AClient, taskId: string) =>
  Effect.tryPromise({
    try: () => client.getTask({ id: taskId }),
    catch: (cause) =>
      cause instanceof Error ? cause : new Error("Could not fetch task from A2A server"),
  })
