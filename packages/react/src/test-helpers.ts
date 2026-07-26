import type { AgentCard, Message, Task } from "@a2a-js/sdk"
import { Client, type Transport } from "@a2a-js/sdk/client"
import type { ConversationId, TurnId } from "./types"

export function agentCard(overrides: Partial<AgentCard> = {}): AgentCard {
  return {
    name: "Test agent",
    description: "Agent used by the test suite",
    protocolVersion: "0.3.0",
    version: "1.0.0",
    url: "https://agent.test/rpc",
    preferredTransport: "JSONRPC",
    capabilities: { streaming: true, pushNotifications: true },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    skills: [],
    ...overrides,
  }
}

export function message(
  text: string,
  overrides: Partial<Message> = {},
): Message {
  return {
    kind: "message",
    messageId: `message-${text}`,
    role: "agent",
    parts: [{ kind: "text", text }],
    ...overrides,
  }
}

export function task(overrides: Partial<Task> = {}): Task {
  return {
    kind: "task",
    id: "task-1",
    contextId: "context-1",
    status: { state: "working" },
    ...overrides,
  }
}

async function* emptyStream() {}

export function testClient(
  overrides: Partial<Transport> = {},
  card = agentCard(),
): Client {
  const transport: Transport = {
    getExtendedAgentCard: async () => card,
    sendMessage: async () => message("response"),
    sendMessageStream: emptyStream,
    setTaskPushNotificationConfig: async (params) => params,
    getTaskPushNotificationConfig: async ({ id }) => ({
      taskId: id,
      pushNotificationConfig: { url: "https://push.test" },
    }),
    listTaskPushNotificationConfig: async () => [],
    deleteTaskPushNotificationConfig: async () => {},
    getTask: async ({ id }) => task({ id }),
    cancelTask: async ({ id }) => task({ id, status: { state: "canceled" } }),
    resubscribeTask: emptyStream,
    ...overrides,
  }
  return new Client(transport, card)
}

export function conversationId(value = "conversation-1"): ConversationId {
  return value as ConversationId
}

export function turnId(value = "turn-1"): TurnId {
  return value as TurnId
}

export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

export async function waitFor(assertion: () => void, timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      assertion()
      return
    } catch (cause) {
      lastError = cause
      await Bun.sleep(1)
    }
  }
  throw lastError
}
