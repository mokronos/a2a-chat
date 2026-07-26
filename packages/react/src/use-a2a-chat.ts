"use client"

import type { JSONRPCResponse, MessageSendConfiguration, Part } from "@a2a-js/sdk"
import type { RequestOptions } from "@a2a-js/sdk/client"
import * as React from "react"
import type { Conversation } from "./reducer"
import {
  A2AChatRuntime,
  type CancelResult,
  type DeleteConversationResult,
  type DeletePushNotificationParams,
  type DisconnectResult,
  type GetPushNotificationParams,
  type GetTaskParams,
  type ListPushNotificationsParams,
  type LoadConversationResult,
  type ResubscribeResult,
  type RuntimeOptions,
  type SetPushNotificationParams,
} from "./runtime"
import type {
  ConnectedState,
  ConnectionState,
  ConnectionTarget,
  ConversationId,
  RecoveryOptions,
  SendCommand,
  TurnId,
} from "./types"

export type UseA2AChatOptions = RuntimeOptions & {
  /** Initial target. Runtime options are intentionally fixed for the controller's lifetime. */
  target?: ConnectionTarget
  autoConnect?: boolean
}

export type A2AChat = {
  readonly connection: ConnectionState
  readonly conversations: readonly Conversation[]
  readonly persistenceError?: Error
  readonly runtime: A2AChatRuntime
  connect(target: ConnectionTarget): Promise<ConnectedState>
  disconnect(): DisconnectResult
  createConversation(id?: ConversationId): Conversation
  getConversation(id: ConversationId): Conversation | undefined
  deleteConversation(id: ConversationId): Promise<DeleteConversationResult>
  loadConversation(id: ConversationId): Promise<LoadConversationResult>
  send(command: SendCommand): Promise<TurnId>
  sendText(input: Omit<SendCommand, "parts"> & { text: string }): Promise<TurnId>
  respondToInput(input: {
    conversationId: ConversationId
    turnId: TurnId
    parts: Part[]
    configuration?: MessageSendConfiguration
  }): Promise<TurnId>
  cancel(turnId: TurnId): Promise<CancelResult>
  getTask(params: GetTaskParams, options?: RequestOptions): ReturnType<A2AChatRuntime["getTask"]>
  resubscribe(turnId: TurnId, options?: RecoveryOptions): Promise<ResubscribeResult>
  setPushNotification(
    params: SetPushNotificationParams,
    options?: RequestOptions,
  ): ReturnType<A2AChatRuntime["setPushNotification"]>
  getPushNotification(
    params: GetPushNotificationParams,
    options?: RequestOptions,
  ): ReturnType<A2AChatRuntime["getPushNotification"]>
  listPushNotifications(
    params: ListPushNotificationsParams,
    options?: RequestOptions,
  ): ReturnType<A2AChatRuntime["listPushNotifications"]>
  deletePushNotification(
    params: DeletePushNotificationParams,
    options?: RequestOptions,
  ): ReturnType<A2AChatRuntime["deletePushNotification"]>
  getAuthenticatedExtendedCard(
    options?: RequestOptions,
  ): ReturnType<A2AChatRuntime["getAuthenticatedExtendedCard"]>
  callExtension<Params, Response extends JSONRPCResponse>(
    method: string,
    params: Params,
    options?: RequestOptions,
  ): Promise<Response>
}

export function useA2AChatController(options: UseA2AChatOptions = {}): A2AChat {
  const initialOptions = React.useRef(options).current
  const runtimeRef = React.useRef<A2AChatRuntime | null>(null)
  if (!runtimeRef.current) {
    const { autoConnect: _autoConnect, target: _target, ...runtimeOptions } = initialOptions
    runtimeRef.current = new A2AChatRuntime(runtimeOptions)
  }
  const runtime = runtimeRef.current
  const snapshot = React.useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getSnapshot,
  )

  React.useEffect(() => {
    if (initialOptions.autoConnect && initialOptions.target) {
      void runtime.connect(initialOptions.target).catch(() => {
        // The failed connection and its classified error are published in the snapshot.
      })
    }
    return () => {
      runtime.dispose()
    }
  }, [initialOptions, runtime])

  return {
    runtime,
    connection: snapshot.connection,
    conversations: snapshot.conversations,
    persistenceError: snapshot.persistenceError,
    connect: (target) => runtime.connect(target),
    disconnect: () => runtime.disconnect(),
    createConversation: (id) => runtime.createConversation(id),
    getConversation: (id) => runtime.getConversation(id),
    deleteConversation: (id) => runtime.deleteConversation(id),
    loadConversation: (id) => runtime.loadConversation(id),
    send: (command) => runtime.send(command),
    sendText: (input) =>
      runtime.send({ ...input, parts: [{ kind: "text", text: input.text }] }),
    respondToInput: (input) => runtime.respondToInput(input),
    cancel: (turnId) => runtime.cancel(turnId),
    getTask: (params, requestOptions) => runtime.getTask(params, requestOptions),
    resubscribe: (turnId, recoveryOptions) => runtime.resubscribe(turnId, recoveryOptions),
    setPushNotification: (params, requestOptions) =>
      runtime.setPushNotification(params, requestOptions),
    getPushNotification: (params, requestOptions) =>
      runtime.getPushNotification(params, requestOptions),
    listPushNotifications: (params, requestOptions) =>
      runtime.listPushNotifications(params, requestOptions),
    deletePushNotification: (params, requestOptions) =>
      runtime.deletePushNotification(params, requestOptions),
    getAuthenticatedExtendedCard: (requestOptions) =>
      runtime.getAuthenticatedExtendedCard(requestOptions),
    callExtension: (method, params, requestOptions) =>
      runtime.callExtension(method, params, requestOptions),
  }
}
