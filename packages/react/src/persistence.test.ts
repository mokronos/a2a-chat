import { describe, expect, it } from "bun:test"
import {
  LocalStorageConversationRepository,
  MemoryConversationRepository,
  PERSISTED_CONVERSATION_VERSION,
  validatePersistedConversation,
  type PersistedConversation,
} from "./persistence"
import type { Conversation } from "./reducer"
import { conversationId, message, turnId } from "./test-helpers"

function conversation(): Conversation {
  return {
    id: conversationId(),
    turns: [
      {
        id: turnId(),
        request: message("request", { role: "user" }),
        events: [],
        artifacts: {},
        lifecycle: { kind: "running" },
      },
    ],
  }
}

function persisted(overrides: Partial<PersistedConversation> = {}): PersistedConversation {
  return {
    version: PERSISTED_CONVERSATION_VERSION,
    conversation: conversation(),
    savedAt: 1,
    ...overrides,
  }
}

class TestStorage implements Storage {
  readonly #values = new Map<string, string>()

  get length() {
    return this.#values.size
  }

  clear(): void {
    this.#values.clear()
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.#values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value)
  }
}

describe("validatePersistedConversation", () => {
  it("validates the complete durable shape", () => {
    expect(validatePersistedConversation(persisted())).toBe(true)
  })

  it("rejects unsupported versions and invalid timestamps", () => {
    expect(validatePersistedConversation({ ...persisted(), version: 2 })).toBe(false)
    expect(validatePersistedConversation({ ...persisted(), savedAt: Number.NaN })).toBe(false)
    expect(validatePersistedConversation({ ...persisted(), savedAt: -1 })).toBe(false)
  })

  it("rejects malformed requests, events, artifacts, and lifecycles", () => {
    const base = persisted()
    const turn = base.conversation.turns[0]!
    const withTurn = (next: unknown) => ({
      ...base,
      conversation: { ...base.conversation, turns: [next] },
    })

    expect(validatePersistedConversation(withTurn({ ...turn, request: { kind: "message" } }))).toBe(false)
    expect(validatePersistedConversation(withTurn({ ...turn, events: [{ kind: "unknown" }] }))).toBe(false)
    expect(
      validatePersistedConversation(
        withTurn({
          ...turn,
          artifacts: { wrong: { artifactId: "artifact-1", parts: [] } },
        }),
      ),
    ).toBe(false)
    expect(validatePersistedConversation(withTurn({ ...turn, lifecycle: { kind: "waiting" } }))).toBe(false)
  })

  it("rejects conflicting task ownership", () => {
    const base = persisted()
    const turn = base.conversation.turns[0]!
    expect(
      validatePersistedConversation({
        ...base,
        conversation: {
          ...base.conversation,
          turns: [
            {
              ...turn,
              taskId: "different-task",
              task: {
                kind: "task",
                id: "task-1",
                contextId: "context-1",
                status: { state: "working" },
              },
            },
          ],
        },
      }),
    ).toBe(false)
  })
})

describe("conversation repositories", () => {
  it("constructs and operates without localStorage during SSR", async () => {
    const repository = new LocalStorageConversationRepository(undefined, "ssr:")
    expect(await repository.load("missing")).toBeNull()
    await expect(repository.save(persisted())).resolves.toBeUndefined()
    await expect(repository.delete("missing")).resolves.toBeUndefined()
  })

  it("round-trips and deletes validated local storage values", async () => {
    const storage = new TestStorage()
    const repository = new LocalStorageConversationRepository(storage, "test:")
    const value = persisted()

    await repository.save(value)
    expect(await repository.load(value.conversation.id)).toEqual(value)
    await repository.delete(value.conversation.id)
    expect(await repository.load(value.conversation.id)).toBeNull()
  })

  it("returns null for malformed local storage data", async () => {
    const storage = new TestStorage()
    storage.setItem("test:bad-json", "{")
    storage.setItem("test:bad-shape", JSON.stringify({ version: 1, conversation: { id: "bad-shape" } }))
    const repository = new LocalStorageConversationRepository(storage, "test:")

    expect(await repository.load("bad-json")).toBeNull()
    expect(await repository.load("bad-shape")).toBeNull()
  })

  it("deterministically prevents an older save from resurrecting a delete", async () => {
    const repository = new MemoryConversationRepository()
    const value = persisted()

    const olderSave = repository.save(value)
    await repository.delete(value.conversation.id)
    await olderSave

    expect(await repository.load(value.conversation.id)).toBeNull()
  })
})
