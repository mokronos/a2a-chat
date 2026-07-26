import type {
  AgentCard,
  ExtensionURI,
  Message,
  MessageSendConfiguration,
  Part,
  Task,
  TaskArtifactUpdateEvent,
  TaskStatusUpdateEvent,
} from "@a2a-js/sdk"
import type { AuthenticationHandler, Client, ClientFactory } from "@a2a-js/sdk/client"

export type Brand<T, Name extends string> = T & { readonly __brand: Name }
export type ConversationId = Brand<string, "ConversationId">
export type TurnId = Brand<string, "TurnId">
export type RunnerId = Brand<string, "RunnerId">

export type ConnectionTarget =
  | { kind: "direct"; baseUrl: string }
  | { kind: "proxy"; targetId: string; basePath?: string }
  | { kind: "client"; client: Client; card?: AgentCard }

export type ConnectionState =
  | { kind: "disconnected" }
  | { kind: "connecting"; target: ConnectionTarget }
  | { kind: "connected"; target: ConnectionTarget; card: AgentCard; client: Client }
  | { kind: "failed"; target: ConnectionTarget; error: Error }

export type ConnectedState = Extract<ConnectionState, { kind: "connected" }>

export type ConnectionOptions = {
  fetch?: typeof fetch
  authentication?: AuthenticationHandler
  clientFactory?: ClientFactory
  resolveCard?: (target: Exclude<ConnectionTarget, { kind: "client" }>) => Promise<AgentCard>
  supportedExtensionUris?: readonly ExtensionURI[]
}

export type A2AEvent = Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent
export type A2AEventKind = A2AEvent["kind"]

export type SendCommand = {
  conversationId: ConversationId
  parts: Part[]
  configuration?: MessageSendConfiguration
  metadata?: Record<string, unknown>
  extensions?: string[]
  referenceTaskIds?: string[]
  /** Explicit task/context for continuations; normally inferred from the conversation. */
  taskId?: string
  contextId?: string
}

export type RecoveryOptions = { attempts?: number; delayMs?: number }

export type A2AChatErrorCode =
  | "connection-failed"
  | "connection-superseded"
  | "duplicate-continuation"
  | "invalid-event"
  | "invalid-persisted-conversation"
  | "not-connected"
  | "persistence-failed"
  | "persistence-unavailable"
  | "resubscribe-unavailable"
  | "turn-not-awaiting-input"
  | "turn-not-found"
  | "unsupported-required-extension"
  | "unsupported-transport-operation"

export class A2AChatError extends Error {
  readonly code: A2AChatErrorCode

  constructor(code: A2AChatErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "A2AChatError"
    this.code = code
  }
}
