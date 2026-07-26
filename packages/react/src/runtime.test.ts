import { describe, expect, it } from "bun:test"
import type {
  AgentCard,
  GetTaskSuccessResponse,
  Message,
  TaskStatusUpdateEvent,
} from "@a2a-js/sdk"
import type { Transport } from "@a2a-js/sdk/client"
import type { ConversationRepository, PersistedConversation } from "./persistence"
import { PERSISTED_CONVERSATION_VERSION } from "./persistence"
import { A2AChatRuntime, createContinuationMessage, recoveryDelay } from "./runtime"
import {
  agentCard,
  conversationId,
  deferred,
  message,
  task,
  testClient,
  waitFor,
} from "./test-helpers"
import { A2AChatError } from "./types"

function storedConversation(
  lifecycle: PersistedConversation["conversation"]["turns"][number]["lifecycle"] = {
    kind: "waiting",
    reason: "stream-closed",
  },
): PersistedConversation {
  const storedTask = task()
  return {
    version: PERSISTED_CONVERSATION_VERSION,
    savedAt: 1,
    conversation: {
      id: conversationId(),
      turns: [
        {
          id: "stored-turn" as never,
          request: message("stored request", {
            role: "user",
            taskId: storedTask.id,
            contextId: storedTask.contextId,
          }),
          events: [storedTask],
          taskId: storedTask.id,
          contextId: storedTask.contextId,
          task: storedTask,
          artifacts: {},
          lifecycle,
        },
      ],
    },
  }
}

describe("A2AChatRuntime state and streams", () => {
  it("publishes stable immutable snapshots for asynchronous events", async () => {
    const gate = deferred<Message>()
    const client = testClient({
      sendMessageStream: async function* () {
        yield await gate.promise
      },
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const first = runtime.getSnapshot()
    let notifications = 0
    const unsubscribe = runtime.subscribe(() => {
      notifications += 1
    })

    const id = conversationId()
    const turnId = await runtime.send({ conversationId: id, parts: [] })
    const afterSend = runtime.getSnapshot()
    expect(afterSend).not.toBe(first)
    expect(runtime.getSnapshot()).toBe(afterSend)
    expect(Object.isFrozen(afterSend.conversations)).toBe(true)

    gate.resolve(message("done", { contextId: "context-async" }))
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("completed"))
    expect(runtime.getConversation(id)?.turns[0]?.id).toBe(turnId)
    expect(notifications).toBeGreaterThanOrEqual(2)
    unsubscribe()
  })

  it("runs concurrent sends independently within one conversation", async () => {
    const gates = [deferred<Message>(), deferred<Message>()]
    let call = 0
    const client = testClient({
      sendMessageStream: async function* () {
        yield await gates[call++]!.promise
      },
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()

    const first = await runtime.send({ conversationId: id, parts: [] })
    const second = await runtime.send({ conversationId: id, parts: [] })
    expect(first).not.toBe(second)
    expect(runtime.getConversation(id)?.turns).toHaveLength(2)

    gates[1]!.resolve(message("second"))
    gates[0]!.resolve(message("first"))
    await waitFor(() =>
      expect(runtime.getConversation(id)?.turns.map((turn) => turn.lifecycle.kind)).toEqual([
        "completed",
        "completed",
      ]),
    )
  })

  it("prevents duplicate pending continuations for one task", async () => {
    const continuationGate = deferred<Message>()
    let calls = 0
    const client = testClient({
      sendMessageStream: async function* () {
        if (calls++ === 0) {
          yield task({ status: { state: "input-required" } })
          return
        }
        yield await continuationGate.promise
      },
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()
    const turnId = await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("awaiting-input"))

    await runtime.respondToInput({ conversationId: id, turnId, parts: [] })
    const duplicate = runtime.respondToInput({ conversationId: id, turnId, parts: [] })
    await expect(duplicate).rejects.toMatchObject({ code: "duplicate-continuation" })
    runtime.disconnect()
  })

  it("propagates context from a bare response to the next send", async () => {
    const sent: Message[] = []
    const client = testClient({
      sendMessageStream: async function* ({ message: request }) {
        sent.push(request)
        yield message("response", { contextId: "context-from-agent" })
      },
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()

    await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("completed"))
    await runtime.send({ conversationId: id, parts: [] })

    expect(sent[1]?.contextId).toBe("context-from-agent")
  })

  it("settles a terminal status update received before a task snapshot", async () => {
    const status: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId: "task-status-only",
      contextId: "context-status-only",
      final: true,
      status: { state: "failed", message: message("status failure") },
    }
    const client = testClient({
      sendMessageStream: async function* () {
        yield status
      },
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()

    await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("failed"))

    expect(runtime.getConversation(id)?.turns[0]?.task?.id).toBe("task-status-only")
    expect(runtime.getConversation(id)?.turns[0]?.statusFinal).toBe(true)
  })

  it("bounds automatic resubscribe when a nonterminal stream closes", async () => {
    let resubscriptions = 0
    const client = testClient({
      sendMessageStream: async function* () {
        yield task()
      },
      resubscribeTask: async function* () {
        resubscriptions += 1
      },
    })
    const runtime = new A2AChatRuntime({ recovery: { attempts: 2, delayMs: 0 } })
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()

    await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("waiting"))

    expect(resubscriptions).toBe(2)
    expect(runtime.getConversation(id)?.turns[0]?.lifecycle).toEqual({
      kind: "waiting",
      reason: "recovery-exhausted",
      error: undefined,
    })
  })

  it("stops recovery when resubscription requests input", async () => {
    let resubscriptions = 0
    const client = testClient({
      sendMessageStream: async function* () {
        yield task()
      },
      resubscribeTask: async function* () {
        resubscriptions += 1
        yield {
          kind: "status-update",
          taskId: "task-1",
          contextId: "context-1",
          final: true,
          status: { state: "auth-required" },
        }
      },
    })
    const runtime = new A2AChatRuntime({ recovery: { attempts: 5, delayMs: 0 } })
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()

    await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("awaiting-input"))

    expect(resubscriptions).toBe(1)
    expect(runtime.getConversation(id)?.turns[0]?.lifecycle).toEqual({
      kind: "awaiting-input",
      reason: "auth-required",
    })
  })

  it("rejects invalid stream values with a classified turn failure", async () => {
    const client = testClient({
      sendMessageStream: async function* () {
        yield { kind: "status-update" } as never
      },
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()

    await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("failed"))
    expect(runtime.getConversation(id)?.turns[0]?.lifecycle).toEqual({
      kind: "failed",
      error: "The agent produced an invalid A2A event",
    })
  })
})

describe("A2AChatRuntime races and cleanup", () => {
  it("does not let a connection complete after disconnect", async () => {
    const cardGate = deferred<AgentCard>()
    const initialCard = agentCard({ supportsAuthenticatedExtendedCard: true })
    const client = testClient({ getExtendedAgentCard: () => cardGate.promise }, initialCard)
    const runtime = new A2AChatRuntime()

    const connecting = runtime.connect({ kind: "client", client })
    runtime.disconnect()
    cardGate.resolve(agentCard())

    await expect(connecting).rejects.toMatchObject({ code: "connection-superseded" })
    expect(runtime.connection.kind).toBe("disconnected")
  })

  it("does not let an older connection overwrite a newer one", async () => {
    const cardGate = deferred<AgentCard>()
    const firstCard = agentCard({ name: "first", supportsAuthenticatedExtendedCard: true })
    const firstClient = testClient({ getExtendedAgentCard: () => cardGate.promise }, firstCard)
    const secondCard = agentCard({ name: "second" })
    const secondClient = testClient({}, secondCard)
    const runtime = new A2AChatRuntime()

    const first = runtime.connect({ kind: "client", client: firstClient })
    await runtime.connect({ kind: "client", client: secondClient, card: secondCard })
    cardGate.resolve(agentCard({ name: "late first" }))

    await expect(first).rejects.toMatchObject({ code: "connection-superseded" })
    expect(runtime.connection).toMatchObject({ kind: "connected", card: { name: "second" } })
  })

  it("aborts locally and reports a remote cancellation error", async () => {
    const streamGate = deferred<void>()
    let signal: AbortSignal | undefined
    const client = testClient({
      sendMessageStream: async function* (_params, options) {
        signal = options?.signal
        yield task()
        await streamGate.promise
      },
      cancelTask: async () => {
        throw new Error("remote cancel failed")
      },
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()
    const turnId = await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.task?.id).toBe("task-1"))

    const result = await runtime.cancel(turnId)

    expect(result).toMatchObject({ kind: "remote-failed", error: { message: "remote cancel failed" } })
    expect(signal?.aborted).toBe(true)
    expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("cancelled")
  })

  it("returns the remote cancellation task while keeping the turn settled locally", async () => {
    const client = testClient({
      sendMessageStream: async function* () {
        yield task()
        await new Promise(() => {})
      },
      cancelTask: async ({ id }) => task({ id, status: { state: "canceled" } }),
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const id = conversationId()
    const turnId = await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.task).toBeDefined())

    const result = await runtime.cancel(turnId)

    expect(result).toMatchObject({ kind: "remote-confirmed", task: { status: { state: "canceled" } } })
    expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("cancelled")
  })

  it("aborts runners on delete and dispose", async () => {
    const signals: AbortSignal[] = []
    const client = testClient({
      sendMessageStream: async function* (_params, options) {
        if (options?.signal) signals.push(options.signal)
        await new Promise(() => {})
      },
    })
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })
    const firstId = conversationId("first")
    await runtime.send({ conversationId: firstId, parts: [] })
    await waitFor(() => expect(signals).toHaveLength(1))
    await runtime.deleteConversation(firstId)
    expect(signals[0]?.aborted).toBe(true)

    await runtime.send({ conversationId: conversationId("second"), parts: [] })
    await waitFor(() => expect(signals).toHaveLength(2))
    expect(runtime.dispose().abortedTurns).toBe(1)
    expect(signals[1]?.aborted).toBe(true)
  })
})

describe("A2AChatRuntime persistence and resumption", () => {
  it("captures repository save failures without an unhandled rejection", async () => {
    const repository: ConversationRepository = {
      load: async () => null,
      save: async () => {
        throw new Error("disk full")
      },
      delete: async () => {},
    }
    const runtime = new A2AChatRuntime({ repository })

    runtime.createConversation(conversationId())
    await waitFor(() => expect(runtime.persistenceError).toBeDefined())

    expect(runtime.persistenceError).toMatchObject({ code: "persistence-failed", message: "disk full" })
  })

  it("rejects a stale load that races with a local mutation", async () => {
    const loadGate = deferred<PersistedConversation | null>()
    const repository: ConversationRepository = {
      load: () => loadGate.promise,
      save: async () => {},
      delete: async () => {},
    }
    const runtime = new A2AChatRuntime({ repository })
    const id = conversationId()

    const loading = runtime.loadConversation(id)
    const local = runtime.createConversation(id)
    loadGate.resolve(storedConversation())

    await expect(loading).resolves.toEqual({ kind: "stale" })
    expect(runtime.getConversation(id)).toBe(local)
  })

  it("loads a persisted task and resumes it after connecting", async () => {
    let resubscriptions = 0
    const repository: ConversationRepository = {
      load: async () => storedConversation(),
      save: async () => {},
      delete: async () => {},
    }
    const client = testClient({
      resubscribeTask: async function* () {
        resubscriptions += 1
        yield {
          kind: "status-update",
          taskId: "task-1",
          contextId: "context-1",
          final: true,
          status: { state: "completed" },
        }
      },
    })
    const runtime = new A2AChatRuntime({ repository, recovery: { delayMs: 0 } })
    const id = conversationId()

    await expect(runtime.loadConversation(id)).resolves.toMatchObject({ kind: "loaded" })
    expect(resubscriptions).toBe(0)
    await runtime.connect({ kind: "client", client, card: agentCard() })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("completed"))

    expect(resubscriptions).toBe(1)
  })

  it("resumes a disconnected nonterminal task on reconnect", async () => {
    const streamGate = deferred<void>()
    let resubscriptions = 0
    const client = testClient({
      sendMessageStream: async function* () {
        yield task()
        await streamGate.promise
      },
      resubscribeTask: async function* () {
        resubscriptions += 1
        yield {
          kind: "status-update",
          taskId: "task-1",
          contextId: "context-1",
          final: true,
          status: { state: "completed" },
        }
      },
    })
    const runtime = new A2AChatRuntime({ recovery: { delayMs: 0 } })
    const target = { kind: "client" as const, client, card: agentCard() }
    const id = conversationId()
    await runtime.connect(target)
    await runtime.send({ conversationId: id, parts: [] })
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.task).toBeDefined())

    runtime.disconnect()
    expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("waiting")
    await runtime.connect(target)
    await waitFor(() => expect(runtime.getConversation(id)?.turns[0]?.lifecycle.kind).toBe("completed"))

    expect(resubscriptions).toBe(1)
  })

  it("classifies load without a repository", async () => {
    const runtime = new A2AChatRuntime()
    const load = runtime.loadConversation(conversationId())
    await expect(load).rejects.toBeInstanceOf(A2AChatError)
    await expect(load).rejects.toMatchObject({ code: "persistence-unavailable" })
  })
})

describe("runtime command helpers", () => {
  it("builds task continuations and bounds recovery delays", () => {
    const continuation = createContinuationMessage({ task: task(), parts: [] })
    expect(continuation).toMatchObject({ taskId: "task-1", contextId: "context-1" })
    expect(recoveryDelay(10)).toBe(30_000)
    expect(recoveryDelay(-1, { delayMs: -10 })).toBe(0)
  })

  it("forwards exact SDK push and extension parameters", async () => {
    const seen: unknown[] = []
    const transport = {
      getTaskPushNotificationConfig: async (params: unknown) => {
        seen.push(params)
        return { taskId: "task-1", pushNotificationConfig: { url: "https://push.test" } }
      },
      callExtensionMethod: async (method: string, params: unknown) => {
        seen.push({ method, params })
        return { jsonrpc: "2.0" as const, id: 1, result: task() }
      },
    } satisfies Partial<Transport> & Record<string, unknown>
    const client = testClient(transport)
    const runtime = new A2AChatRuntime()
    await runtime.connect({ kind: "client", client, card: agentCard() })

    await runtime.getPushNotification({ id: "task-1" })
    const extension = await runtime.callExtension<
      { value: number },
      GetTaskSuccessResponse
    >("urn:test/method", { value: 1 })

    expect(seen).toEqual([
      { id: "task-1" },
      { method: "urn:test/method", params: { value: 1 } },
    ])
    expect(extension.result.id).toBe("task-1")
  })
})
