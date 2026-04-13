import type { Client } from "@a2a-js/sdk/client"

export type ConnectionState = "idle" | "connecting" | "connected" | "error"

export type A2AConversationState = {
  contextId?: string
  taskId?: string
}

export type A2AClient = Client
