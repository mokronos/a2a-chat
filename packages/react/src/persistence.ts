import { isA2AEvent, isArtifact, isMessageEvent, isRecord, isTaskEvent } from "./events"
import type { Conversation, TurnLifecycle } from "./reducer"

export const PERSISTED_CONVERSATION_VERSION = 1 as const

export type PersistedConversation = {
  readonly version: typeof PERSISTED_CONVERSATION_VERSION
  readonly conversation: Conversation
  readonly savedAt: number
}

export interface ConversationRepository {
  load(id: string): Promise<PersistedConversation | null>
  save(value: PersistedConversation): Promise<void>
  delete(id: string): Promise<void>
}

function isLifecycle(value: unknown): value is TurnLifecycle {
  if (!isRecord(value) || typeof value.kind !== "string") return false

  switch (value.kind) {
    case "draft":
    case "running":
    case "completed":
    case "cancelled":
      return true
    case "recovering":
      return typeof value.attempt === "number" && Number.isInteger(value.attempt) && value.attempt >= 0
    case "waiting":
      return (
        (value.reason === "stream-closed" || value.reason === "recovery-exhausted") &&
        (value.error === undefined || typeof value.error === "string")
      )
    case "awaiting-input":
      return value.reason === "input-required" || value.reason === "auth-required"
    case "failed":
      return typeof value.error === "string"
    default:
      return false
  }
}

function isTurn(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isMessageEvent(value.request) ||
    value.request.role !== "user" ||
    !Array.isArray(value.events) ||
    !value.events.every(isA2AEvent) ||
    !isRecord(value.artifacts) ||
    !Object.entries(value.artifacts).every(([id, artifact]) => isArtifact(artifact) && artifact.artifactId === id) ||
    !isLifecycle(value.lifecycle) ||
    (value.taskId !== undefined && typeof value.taskId !== "string") ||
    (value.contextId !== undefined && typeof value.contextId !== "string") ||
    (value.statusFinal !== undefined && typeof value.statusFinal !== "boolean") ||
    (value.task !== undefined && !isTaskEvent(value.task))
  ) {
    return false
  }

  if (value.task !== undefined) {
    if (value.taskId !== undefined && value.taskId !== value.task.id) return false
    if (value.contextId !== undefined && value.contextId !== value.task.contextId) return false
  }
  return true
}

export function validatePersistedConversation(value: unknown): value is PersistedConversation {
  return (
    isRecord(value) &&
    value.version === PERSISTED_CONVERSATION_VERSION &&
    typeof value.savedAt === "number" &&
    Number.isFinite(value.savedAt) &&
    value.savedAt >= 0 &&
    isRecord(value.conversation) &&
    typeof value.conversation.id === "string" &&
    Array.isArray(value.conversation.turns) &&
    value.conversation.turns.every(isTurn)
  )
}

export class MemoryConversationRepository implements ConversationRepository {
  readonly #values = new Map<string, PersistedConversation>()
  readonly #revisions = new Map<string, number>()

  async load(id: string): Promise<PersistedConversation | null> {
    return this.#values.get(id) ?? null
  }

  async save(value: PersistedConversation): Promise<void> {
    const id = value.conversation.id
    const revision = (this.#revisions.get(id) ?? 0) + 1
    this.#revisions.set(id, revision)
    await Promise.resolve()
    if (this.#revisions.get(id) === revision) this.#values.set(id, value)
  }

  async delete(id: string): Promise<void> {
    this.#revisions.set(id, (this.#revisions.get(id) ?? 0) + 1)
    this.#values.delete(id)
  }
}

export class LocalStorageConversationRepository implements ConversationRepository {
  readonly #revisions = new Map<string, number>()
  readonly #storage: Storage | undefined

  constructor(storage?: Storage, private readonly prefix = "a2a-chat:") {
    this.#storage = storage ?? (typeof localStorage === "undefined" ? undefined : localStorage)
  }

  async load(id: string): Promise<PersistedConversation | null> {
    const raw = this.#storage?.getItem(this.prefix + id)
    if (!raw) return null

    try {
      const value: unknown = JSON.parse(raw)
      return validatePersistedConversation(value) ? value : null
    } catch {
      return null
    }
  }

  async save(value: PersistedConversation): Promise<void> {
    if (!this.#storage) return

    const id = value.conversation.id
    const revision = (this.#revisions.get(id) ?? 0) + 1
    this.#revisions.set(id, revision)
    await Promise.resolve()
    if (this.#revisions.get(id) === revision) {
      this.#storage.setItem(this.prefix + id, JSON.stringify(value))
    }
  }

  async delete(id: string): Promise<void> {
    this.#revisions.set(id, (this.#revisions.get(id) ?? 0) + 1)
    this.#storage?.removeItem(this.prefix + id)
  }
}
