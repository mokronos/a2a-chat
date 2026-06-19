import { Data, Effect } from "effect"
import type { MessageSendParams } from "@a2a-js/sdk"

import { createJsonRpcClient } from "./helpers"
import type { A2AClient, A2AProxyTransport } from "./types"

class A2AServiceError extends Data.TaggedError("A2AServiceError")<{
  message: string
  cause: unknown
}> {}

function toServiceError(cause: unknown, message: string) {
  return new A2AServiceError({
    cause,
    message: cause instanceof Error && cause.message.trim().length > 0 ? cause.message : message,
  })
}

export const connectJsonRpc = (baseUrl: string, transport: A2AProxyTransport) =>
  Effect.tryPromise({
    try: () => createJsonRpcClient(baseUrl, transport),
    catch: (cause) => toServiceError(cause, "Could not connect to the A2A server"),
  })

export const sendTaskMessageStream = (
  client: A2AClient,
  params: MessageSendParams,
  signal: AbortSignal
): Effect.Effect<AsyncIterable<unknown>, never, never> =>
  Effect.sync(() => client.sendMessageStream(params, { signal }) as AsyncIterable<unknown>)

export const resubscribeToTask = (
  client: A2AClient,
  taskId: string,
  signal: AbortSignal
): Effect.Effect<AsyncIterable<unknown>, never, never> =>
  Effect.sync(() => client.resubscribeTask({ id: taskId }, { signal }) as AsyncIterable<unknown>)

export const getTaskById = (client: A2AClient, taskId: string) =>
  Effect.tryPromise({
    try: () => client.getTask({ id: taskId }),
    catch: (cause) => toServiceError(cause, "Could not fetch task from A2A server"),
  })

export const cancelTaskById = (client: A2AClient, taskId: string) =>
  Effect.tryPromise({
    try: () => client.cancelTask({ id: taskId }),
    catch: (cause) => toServiceError(cause, "Could not cancel task on the A2A server"),
  })
