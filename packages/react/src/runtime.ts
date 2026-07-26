import type {
  AgentCard,
  ExtensionURI,
  JSONRPCResponse,
  Message,
  MessageSendConfiguration,
  Part,
  Task,
} from "@a2a-js/sdk"
import {
  Client,
  ClientFactory,
  DefaultAgentCardResolver,
  JsonRpcTransport,
  JsonRpcTransportFactory,
  RestTransportFactory,
  createAuthenticatingFetchWithRetry,
  type RequestOptions,
  type Transport,
} from "@a2a-js/sdk/client"
import { isA2AEvent } from "./events"
import {
  PERSISTED_CONVERSATION_VERSION,
  validatePersistedConversation,
  type ConversationRepository,
} from "./persistence"
import { createProxyEndpoint } from "./proxy"
import {
  conversationReducer,
  isResumableLifecycle,
  isSettledLifecycle,
  type Conversation,
  type ConversationAction,
  type Turn,
  type TurnLifecycle,
} from "./reducer"
import {
  A2AChatError,
  type A2AEvent,
  type ConnectedState,
  type ConnectionOptions,
  type ConnectionState,
  type ConnectionTarget,
  type ConversationId,
  type RecoveryOptions,
  type RunnerId,
  type SendCommand,
  type TurnId,
} from "./types"

const DEFAULT_RECOVERY_ATTEMPTS = 3
const MAX_RECOVERY_ATTEMPTS = 10

const makeId = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`

const asConversationId = (value: string) => value as ConversationId
const asTurnId = (value: string) => value as TurnId
const asRunnerId = (value: string) => value as RunnerId

type Runner = {
  readonly id: RunnerId
  readonly controller: AbortController
  readonly connectionRevision: number
  readonly continuationKey?: string
}

type ConsumeResult = "aborted" | "closed" | "paused" | "settled"

export type RuntimeOptions = ConnectionOptions & {
  repository?: ConversationRepository
  recovery?: RecoveryOptions
}

export type RuntimeSnapshot = {
  readonly connection: ConnectionState
  readonly conversations: readonly Conversation[]
  readonly persistenceError?: Error
  readonly revision: number
}

export type DeleteConversationResult = {
  readonly kind: "deleted" | "not-found"
  readonly persistenceError?: Error
}

export type LoadConversationResult =
  | { readonly kind: "loaded"; readonly conversation: Conversation }
  | { readonly kind: "not-found" }
  | { readonly kind: "stale" }

export type CancelResult =
  | { readonly kind: "local-only" }
  | { readonly kind: "remote-confirmed"; readonly task: Task }
  | { readonly kind: "remote-failed"; readonly error: Error }

export type ResubscribeResult =
  | { readonly kind: "settled"; readonly attempts: number; readonly lifecycle: TurnLifecycle }
  | { readonly kind: "waiting"; readonly attempts: number; readonly error?: Error }
  | {
      readonly kind: "skipped"
      readonly reason: "awaiting-input" | "settled"
      readonly lifecycle: TurnLifecycle
    }
  | { readonly kind: "aborted"; readonly attempts: number }

export type DisconnectResult = { readonly abortedTurns: number }

export type SetPushNotificationParams = Parameters<Client["setTaskPushNotificationConfig"]>[0]
export type GetPushNotificationParams = Parameters<Client["getTaskPushNotificationConfig"]>[0]
export type ListPushNotificationsParams = Parameters<Client["listTaskPushNotificationConfig"]>[0]
export type DeletePushNotificationParams = Parameters<Client["deleteTaskPushNotificationConfig"]>[0]
export type GetTaskParams = Parameters<Client["getTask"]>[0]

export function createContinuationMessage(input: {
  parts: Part[]
  task: Task
  metadata?: Record<string, unknown>
  extensions?: string[]
  referenceTaskIds?: string[]
}): Message {
  return {
    kind: "message",
    messageId: makeId("message"),
    role: "user",
    parts: input.parts,
    taskId: input.task.id,
    contextId: input.task.contextId,
    metadata: input.metadata,
    extensions: input.extensions,
    referenceTaskIds: input.referenceTaskIds,
  }
}

export function requiredExtensions(
  card: AgentCard,
  supported: readonly ExtensionURI[] = [],
): ExtensionURI[] {
  const allowed = new Set(supported)
  return (card.capabilities.extensions ?? [])
    .filter((extension) => extension.required && !allowed.has(extension.uri))
    .map((extension) => extension.uri)
}

export function recoveryDelay(attempt: number, options: RecoveryOptions = {}): number {
  const base = Math.max(0, options.delayMs ?? 250)
  return Math.min(30_000, base * 2 ** Math.max(0, attempt))
}

function normalizedRecoveryAttempts(options: RecoveryOptions): number {
  const attempts = options.attempts ?? DEFAULT_RECOVERY_ATTEMPTS
  if (!Number.isFinite(attempts)) return MAX_RECOVERY_ATTEMPTS
  return Math.min(MAX_RECOVERY_ATTEMPTS, Math.max(0, Math.floor(attempts)))
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause))
}

function assertSupportedExtensions(card: AgentCard, options: ConnectionOptions): void {
  const missing = requiredExtensions(card, options.supportedExtensionUris)
  if (missing.length > 0) {
    throw new A2AChatError(
      "unsupported-required-extension",
      `Unsupported required A2A extensions: ${missing.join(", ")}`,
    )
  }
}

function connectionFetch(options: ConnectionOptions): typeof fetch | undefined {
  const baseFetch = options.fetch ?? globalThis.fetch
  return options.authentication
    ? createAuthenticatingFetchWithRetry(baseFetch, options.authentication)
    : options.fetch
}

export async function connectTarget(
  target: ConnectionTarget,
  options: ConnectionOptions = {},
): Promise<{ client: Client; card: AgentCard }> {
  if (target.kind === "client") {
    const card = target.card ?? (await target.client.getAgentCard())
    assertSupportedExtensions(card, options)
    return { client: target.client, card }
  }

  const fetchImpl = connectionFetch(options)

  if (target.kind === "proxy") {
    const card = options.resolveCard
      ? await options.resolveCard(target)
      : await (async () => {
          const response = await (fetchImpl ?? globalThis.fetch)(
            createProxyEndpoint(target.basePath, "agent-card", target.targetId),
          )
          if (!response.ok) throw new Error(`Agent card request failed (${response.status})`)
          return response.json() as Promise<AgentCard>
        })()

    assertSupportedExtensions(card, options)
    const transport = new JsonRpcTransport({
      endpoint: createProxyEndpoint(target.basePath, "jsonrpc", target.targetId),
      fetchImpl,
    })
    return { client: new Client(transport, card), card }
  }

  const resolver = options.resolveCard
    ? { resolve: () => options.resolveCard!(target) }
    : new DefaultAgentCardResolver({ fetchImpl })
  const card = await resolver.resolve(
    target.baseUrl.endsWith("/") ? target.baseUrl : `${target.baseUrl}/`,
  )
  assertSupportedExtensions(card, options)

  const factory =
    options.clientFactory ??
    new ClientFactory({
      transports: [
        new JsonRpcTransportFactory({ fetchImpl }),
        new RestTransportFactory({ fetchImpl }),
      ],
      cardResolver: resolver,
    })
  return { client: await factory.createFromAgentCard(card), card }
}

export class A2AChatRuntime {
  readonly #options: RuntimeOptions
  readonly #conversations = new Map<ConversationId, Conversation>()
  readonly #conversationRevisions = new Map<ConversationId, number>()
  readonly #listeners = new Set<() => void>()
  readonly #persistenceQueues = new Map<ConversationId, Promise<Error | undefined>>()
  readonly #runners = new Map<TurnId, Runner>()
  readonly #pendingContinuations = new Map<string, TurnId>()

  #connection: ConnectionState = { kind: "disconnected" }
  #connectionRevision = 0
  #persistenceError: Error | undefined
  #snapshot: RuntimeSnapshot

  constructor(options: RuntimeOptions = {}) {
    this.#options = options
    this.#snapshot = this.#createSnapshot(0)
  }

  get connection(): ConnectionState {
    return this.#connection
  }

  get conversations(): readonly Conversation[] {
    return this.#snapshot.conversations
  }

  get persistenceError(): Error | undefined {
    return this.#persistenceError
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  readonly getSnapshot = (): RuntimeSnapshot => this.#snapshot

  getConversation(id: ConversationId): Conversation | undefined {
    return this.#conversations.get(id)
  }

  createConversation(id = asConversationId(makeId("conversation"))): Conversation {
    const current = this.#conversations.get(id)
    if (current) return current

    const conversation: Conversation = { id, turns: [] }
    this.#conversations.set(id, conversation)
    this.#bumpConversationRevision(id)
    this.#persistConversation(conversation)
    this.#publish()
    return conversation
  }

  async deleteConversation(id: ConversationId): Promise<DeleteConversationResult> {
    const conversation = this.#conversations.get(id)
    if (!conversation) return { kind: "not-found" }

    for (const turn of conversation.turns) this.#abortRunner(turn.id)
    this.#conversations.delete(id)
    this.#bumpConversationRevision(id)
    this.#publish()

    const repository = this.#options.repository
    const persistenceError = repository
      ? await this.#enqueuePersistence(id, () => repository.delete(id))
      : undefined
    return { kind: "deleted", persistenceError }
  }

  async loadConversation(id: ConversationId): Promise<LoadConversationResult> {
    const repository = this.#options.repository
    if (!repository) {
      throw new A2AChatError("persistence-unavailable", "No conversation repository is configured")
    }

    const revision = this.#conversationRevisions.get(id) ?? 0
    let persisted: unknown
    try {
      persisted = await repository.load(id)
    } catch (cause) {
      const error = new A2AChatError("persistence-failed", "Failed to load conversation", {
        cause,
      })
      this.#recordPersistenceError(error)
      throw error
    }

    if ((this.#conversationRevisions.get(id) ?? 0) !== revision) return { kind: "stale" }
    if (persisted === null) return { kind: "not-found" }
    if (!validatePersistedConversation(persisted) || persisted.conversation.id !== id) {
      throw new A2AChatError(
        "invalid-persisted-conversation",
        `Stored conversation ${id} is invalid`,
      )
    }

    this.#conversations.set(id, persisted.conversation)
    this.#bumpConversationRevision(id)
    this.#publish()
    this.#resumeEligibleTurns()
    return { kind: "loaded", conversation: persisted.conversation }
  }

  async connect(target: ConnectionTarget): Promise<ConnectedState> {
    const revision = ++this.#connectionRevision
    this.#abortAllRunners(true)
    this.#connection = { kind: "connecting", target }
    this.#publish()

    try {
      const { client, card } = await connectTarget(target, this.#options)
      if (revision !== this.#connectionRevision) {
        throw new A2AChatError(
          "connection-superseded",
          "Connection attempt was superseded by a newer connection state",
        )
      }

      const connected: ConnectedState = { kind: "connected", target, client, card }
      this.#connection = connected
      this.#publish()
      this.#resumeEligibleTurns()
      return connected
    } catch (cause) {
      if (revision !== this.#connectionRevision) {
        if (cause instanceof A2AChatError && cause.code === "connection-superseded") throw cause
        throw new A2AChatError(
          "connection-superseded",
          "Connection attempt was superseded by a newer connection state",
          { cause },
        )
      }

      const source = toError(cause)
      const error =
        source instanceof A2AChatError
          ? source
          : new A2AChatError("connection-failed", source.message, { cause: source })
      this.#connection = { kind: "failed", target, error }
      this.#publish()
      throw error
    }
  }

  disconnect(): DisconnectResult {
    ++this.#connectionRevision
    const abortedTurns = this.#abortAllRunners(true)
    this.#connection = { kind: "disconnected" }
    this.#publish()
    return { abortedTurns }
  }

  dispose(): DisconnectResult {
    const result = this.disconnect()
    this.#listeners.clear()
    return result
  }

  async send(command: SendCommand): Promise<TurnId> {
    const connection = this.#connectedClient()
    const conversation =
      this.#conversations.get(command.conversationId) ?? this.createConversation(command.conversationId)
    const task = this.#continuationTask(conversation, command.taskId)
    const inferredTask =
      !command.taskId &&
      (task?.status.state === "input-required" || task?.status.state === "auth-required")
        ? task
        : undefined
    const taskId = command.taskId ?? inferredTask?.id
    const contextId =
      command.contextId ??
      task?.contextId ??
      [...conversation.turns].reverse().find((turn) => turn.contextId)?.contextId

    const continuationKey = taskId ? this.#continuationKey(command.conversationId, taskId) : undefined
    if (continuationKey && this.#pendingContinuations.has(continuationKey)) {
      throw new A2AChatError(
        "duplicate-continuation",
        `A continuation for task ${taskId} is already pending`,
      )
    }

    const message: Message =
      taskId && task
        ? createContinuationMessage({ ...command, task })
        : {
            kind: "message",
            messageId: makeId("message"),
            role: "user",
            parts: command.parts,
            taskId,
            contextId,
            metadata: command.metadata,
            extensions: command.extensions,
            referenceTaskIds: command.referenceTaskIds,
          }

    const turnId = asTurnId(makeId("turn"))
    const turn: Turn = {
      id: turnId,
      request: message,
      events: [],
      taskId: message.taskId,
      contextId: message.contextId,
      artifacts: {},
      lifecycle: { kind: "running" },
    }
    this.#update(command.conversationId, { kind: "turn-started", turn })

    const runner = this.#createRunner(continuationKey)
    this.#runners.set(turnId, runner)
    if (continuationKey) this.#pendingContinuations.set(continuationKey, turnId)

    let stream: AsyncIterable<A2AEvent>
    try {
      stream = connection.client.sendMessageStream(
        { message, configuration: command.configuration },
        { signal: runner.controller.signal },
      )
    } catch (cause) {
      this.#finishRunner(turnId, runner)
      const error = toError(cause)
      this.#update(command.conversationId, {
        kind: "turn-failed",
        turnId,
        error: error.message,
      })
      throw error
    }

    void this.#runInitialStream(command.conversationId, turnId, runner, stream).catch((cause) => {
      this.#failRunner(command.conversationId, turnId, runner, cause)
    })
    return turnId
  }

  async respondToInput(input: {
    conversationId: ConversationId
    turnId: TurnId
    parts: Part[]
    configuration?: MessageSendConfiguration
  }): Promise<TurnId> {
    const turn = this.#conversations
      .get(input.conversationId)
      ?.turns.find((candidate) => candidate.id === input.turnId)
    if (!turn) throw new A2AChatError("turn-not-found", `Turn ${input.turnId} was not found`)
    if (!turn.task || turn.lifecycle.kind !== "awaiting-input") {
      throw new A2AChatError(
        "turn-not-awaiting-input",
        `Turn ${input.turnId} is not awaiting input`,
      )
    }

    return this.send({
      conversationId: input.conversationId,
      parts: input.parts,
      configuration: input.configuration,
      taskId: turn.task.id,
      contextId: turn.task.contextId,
    })
  }

  async cancel(turnId: TurnId): Promise<CancelResult> {
    const found = this.#findTurn(turnId)
    if (!found) throw new A2AChatError("turn-not-found", `Turn ${turnId} was not found`)

    this.#abortRunner(turnId)
    this.#update(found.conversationId, { kind: "turn-cancelled", turnId })

    const taskId = found.turn.taskId ?? found.turn.task?.id
    if (!taskId || this.#connection.kind !== "connected") return { kind: "local-only" }

    try {
      const task = await this.#connection.client.cancelTask({ id: taskId })
      if (this.#findTurn(turnId)) {
        this.#update(found.conversationId, { kind: "event-received", turnId, event: task })
        this.#update(found.conversationId, { kind: "turn-cancelled", turnId })
      }
      return { kind: "remote-confirmed", task }
    } catch (cause) {
      return { kind: "remote-failed", error: toError(cause) }
    }
  }

  async getTask(params: GetTaskParams, options?: RequestOptions): Promise<Task> {
    return this.#connectedClient().client.getTask(params, options)
  }

  async resubscribe(turnId: TurnId, options: RecoveryOptions = {}): Promise<ResubscribeResult> {
    const found = this.#findTurn(turnId)
    if (!found) throw new A2AChatError("turn-not-found", `Turn ${turnId} was not found`)
    if (found.turn.lifecycle.kind === "awaiting-input") {
      return {
        kind: "skipped",
        reason: "awaiting-input",
        lifecycle: found.turn.lifecycle,
      }
    }
    if (isSettledLifecycle(found.turn.lifecycle)) {
      return { kind: "skipped", reason: "settled", lifecycle: found.turn.lifecycle }
    }
    if (!found.turn.taskId && !found.turn.task) {
      throw new A2AChatError(
        "resubscribe-unavailable",
        `Turn ${turnId} has no task to resubscribe to`,
      )
    }
    this.#connectedClient()

    this.#abortRunner(turnId)
    const runner = this.#createRunner()
    this.#runners.set(turnId, runner)
    try {
      return await this.#recover(found.conversationId, turnId, runner, options)
    } finally {
      this.#finishRunner(turnId, runner)
    }
  }

  async setPushNotification(
    params: SetPushNotificationParams,
    options?: RequestOptions,
  ): ReturnType<Client["setTaskPushNotificationConfig"]> {
    return this.#connectedClient().client.setTaskPushNotificationConfig(params, options)
  }

  async getPushNotification(
    params: GetPushNotificationParams,
    options?: RequestOptions,
  ): ReturnType<Client["getTaskPushNotificationConfig"]> {
    return this.#connectedClient().client.getTaskPushNotificationConfig(params, options)
  }

  async listPushNotifications(
    params: ListPushNotificationsParams,
    options?: RequestOptions,
  ): ReturnType<Client["listTaskPushNotificationConfig"]> {
    return this.#connectedClient().client.listTaskPushNotificationConfig(params, options)
  }

  async deletePushNotification(
    params: DeletePushNotificationParams,
    options?: RequestOptions,
  ): ReturnType<Client["deleteTaskPushNotificationConfig"]> {
    return this.#connectedClient().client.deleteTaskPushNotificationConfig(params, options)
  }

  async getAuthenticatedExtendedCard(options?: RequestOptions): Promise<AgentCard> {
    return this.#connectedClient().client.getAgentCard(options)
  }

  async callExtension<Params, Response extends JSONRPCResponse>(
    method: string,
    params: Params,
    options?: RequestOptions,
  ): Promise<Response> {
    const transport = this.#connectedClient().client.transport
    if (!supportsExtensionMethods(transport)) {
      throw new A2AChatError(
        "unsupported-transport-operation",
        "The selected transport does not support extension methods",
      )
    }
    return transport.callExtensionMethod<Params, Response>(method, params, Date.now(), options)
  }

  #connectedClient(): ConnectedState {
    if (this.#connection.kind !== "connected") {
      throw new A2AChatError("not-connected", "The runtime is not connected")
    }
    return this.#connection
  }

  #createRunner(continuationKey?: string): Runner {
    return {
      id: asRunnerId(makeId("runner")),
      controller: new AbortController(),
      connectionRevision: this.#connectionRevision,
      continuationKey,
    }
  }

  #continuationTask(conversation: Conversation, taskId: string | undefined): Task | undefined {
    const tasks = conversation.turns.flatMap((turn) => (turn.task ? [turn.task] : []))
    if (taskId) return tasks.find((task) => task.id === taskId)
    return [...tasks]
      .reverse()
      .find(
        (task) =>
          task.status.state === "input-required" || task.status.state === "auth-required",
      )
  }

  #continuationKey(conversationId: ConversationId, taskId: string): string {
    return `${conversationId}\u0000${taskId}`
  }

  #update(id: ConversationId, action: ConversationAction): void {
    const conversation = this.#conversations.get(id)
    if (!conversation) return

    const next = conversationReducer(conversation, action)
    if (next === conversation) return
    this.#conversations.set(id, next)
    this.#bumpConversationRevision(id)
    this.#persistConversation(next)
    this.#publish()
  }

  #findTurn(turnId: TurnId): { conversationId: ConversationId; turn: Turn } | undefined {
    for (const [conversationId, conversation] of this.#conversations) {
      const turn = conversation.turns.find((candidate) => candidate.id === turnId)
      if (turn) return { conversationId, turn }
    }
    return undefined
  }

  async #runInitialStream(
    conversationId: ConversationId,
    turnId: TurnId,
    runner: Runner,
    stream: AsyncIterable<A2AEvent>,
  ): Promise<void> {
    let outcome: ConsumeResult = "closed"
    let streamError: Error | undefined
    try {
      outcome = await this.#consume(conversationId, turnId, runner, stream)
    } catch (cause) {
      streamError = toError(cause)
    }

    if (!this.#isCurrentRunner(turnId, runner) || runner.controller.signal.aborted) return
    if (outcome === "paused" || outcome === "settled") {
      this.#finishRunner(turnId, runner)
      return
    }

    const found = this.#findTurn(turnId)
    if (!found?.turn.taskId && !found?.turn.task) {
      if (streamError) {
        this.#update(conversationId, {
          kind: "turn-failed",
          turnId,
          error: streamError.message,
        })
      } else {
        this.#update(conversationId, {
          kind: "turn-waiting",
          turnId,
          reason: "stream-closed",
        })
      }
      this.#finishRunner(turnId, runner)
      return
    }

    try {
      await this.#recover(conversationId, turnId, runner, this.#options.recovery, streamError)
    } finally {
      this.#finishRunner(turnId, runner)
    }
  }

  async #recover(
    conversationId: ConversationId,
    turnId: TurnId,
    runner: Runner,
    options: RecoveryOptions = {},
    initialError?: Error,
  ): Promise<ResubscribeResult> {
    const attempts = normalizedRecoveryAttempts(options)
    let lastError = initialError

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      if (!this.#isCurrentRunner(turnId, runner) || runner.controller.signal.aborted) {
        return { kind: "aborted", attempts: attempt - 1 }
      }

      const found = this.#findTurn(turnId)
      if (!found) return { kind: "aborted", attempts: attempt - 1 }
      if (found.turn.lifecycle.kind === "awaiting-input") {
        return {
          kind: "skipped",
          reason: "awaiting-input",
          lifecycle: found.turn.lifecycle,
        }
      }
      if (isSettledLifecycle(found.turn.lifecycle)) {
        return { kind: "skipped", reason: "settled", lifecycle: found.turn.lifecycle }
      }

      this.#update(conversationId, { kind: "turn-recovering", turnId, attempt })
      const waited = await waitForDelay(
        recoveryDelay(attempt - 1, options),
        runner.controller.signal,
      )
      if (!waited || !this.#isCurrentRunner(turnId, runner)) {
        return { kind: "aborted", attempts: attempt - 1 }
      }

      const taskId = found.turn.taskId ?? found.turn.task?.id
      if (!taskId || this.#connection.kind !== "connected") {
        return { kind: "aborted", attempts: attempt - 1 }
      }

      try {
        const stream = this.#connection.client.resubscribeTask(
          { id: taskId },
          { signal: runner.controller.signal },
        )
        const outcome = await this.#consume(conversationId, turnId, runner, stream)
        const current = this.#findTurn(turnId)?.turn
        if (outcome === "paused" && current) {
          return {
            kind: "skipped",
            reason: "awaiting-input",
            lifecycle: current.lifecycle,
          }
        }
        if (outcome === "settled" && current) {
          return { kind: "settled", attempts: attempt, lifecycle: current.lifecycle }
        }
      } catch (cause) {
        lastError = toError(cause)
      }
    }

    if (this.#isCurrentRunner(turnId, runner) && !runner.controller.signal.aborted) {
      this.#update(conversationId, {
        kind: "turn-waiting",
        turnId,
        reason: attempts === 0 ? "stream-closed" : "recovery-exhausted",
        error: lastError?.message,
      })
    }
    return { kind: "waiting", attempts, error: lastError }
  }

  async #consume(
    conversationId: ConversationId,
    turnId: TurnId,
    runner: Runner,
    stream: AsyncIterable<A2AEvent>,
  ): Promise<ConsumeResult> {
    for await (const value of stream as AsyncIterable<unknown>) {
      if (!this.#isCurrentRunner(turnId, runner) || runner.controller.signal.aborted) {
        return "aborted"
      }
      if (!isA2AEvent(value)) {
        throw new A2AChatError("invalid-event", "The agent produced an invalid A2A event")
      }

      this.#update(conversationId, { kind: "event-received", turnId, event: value })
      const turn = this.#findTurn(turnId)?.turn
      if (!turn) return "aborted"
      if (turn.lifecycle.kind === "awaiting-input") return "paused"
      if (isSettledLifecycle(turn.lifecycle)) return "settled"
      if (value.kind === "status-update" && value.final) return "closed"
    }

    if (!this.#isCurrentRunner(turnId, runner) || runner.controller.signal.aborted) {
      return "aborted"
    }
    const turn = this.#findTurn(turnId)?.turn
    if (turn?.lifecycle.kind === "awaiting-input") return "paused"
    if (turn && isSettledLifecycle(turn.lifecycle)) return "settled"
    return "closed"
  }

  #resumeEligibleTurns(): void {
    if (this.#connection.kind !== "connected") return

    for (const [conversationId, conversation] of this.#conversations) {
      for (const turn of conversation.turns) {
        if (
          this.#runners.has(turn.id) ||
          !isResumableLifecycle(turn.lifecycle) ||
          (!turn.taskId && !turn.task)
        ) {
          continue
        }

        const runner = this.#createRunner()
        this.#runners.set(turn.id, runner)
        void this.#recover(conversationId, turn.id, runner, this.#options.recovery)
          .catch((cause) => this.#failRunner(conversationId, turn.id, runner, cause))
          .finally(() => this.#finishRunner(turn.id, runner))
      }
    }
  }

  #failRunner(
    conversationId: ConversationId,
    turnId: TurnId,
    runner: Runner,
    cause: unknown,
  ): void {
    if (!this.#isCurrentRunner(turnId, runner) || runner.controller.signal.aborted) return
    this.#update(conversationId, {
      kind: "turn-failed",
      turnId,
      error: toError(cause).message,
    })
    this.#finishRunner(turnId, runner)
  }

  #isCurrentRunner(turnId: TurnId, runner: Runner): boolean {
    return (
      this.#runners.get(turnId)?.id === runner.id &&
      runner.connectionRevision === this.#connectionRevision
    )
  }

  #finishRunner(turnId: TurnId, runner: Runner): void {
    if (this.#runners.get(turnId)?.id === runner.id) this.#runners.delete(turnId)
    if (runner.continuationKey && this.#pendingContinuations.get(runner.continuationKey) === turnId) {
      this.#pendingContinuations.delete(runner.continuationKey)
    }
  }

  #abortRunner(turnId: TurnId): boolean {
    const runner = this.#runners.get(turnId)
    if (!runner) return false
    runner.controller.abort()
    this.#finishRunner(turnId, runner)
    return true
  }

  #abortAllRunners(markWaiting: boolean): number {
    const running = [...this.#runners.entries()]
    for (const [turnId, runner] of running) {
      runner.controller.abort()
      this.#finishRunner(turnId, runner)
      if (!markWaiting) continue

      const found = this.#findTurn(turnId)
      if (found && isResumableLifecycle(found.turn.lifecycle)) {
        this.#update(found.conversationId, {
          kind: "turn-waiting",
          turnId,
          reason: "stream-closed",
        })
      }
    }
    return running.length
  }

  #bumpConversationRevision(id: ConversationId): number {
    const revision = (this.#conversationRevisions.get(id) ?? 0) + 1
    this.#conversationRevisions.set(id, revision)
    return revision
  }

  #persistConversation(conversation: Conversation): void {
    const repository = this.#options.repository
    if (!repository) return

    const revision = this.#conversationRevisions.get(conversation.id) ?? 0
    const value = {
      version: PERSISTED_CONVERSATION_VERSION,
      conversation,
      savedAt: Date.now(),
    }
    void this.#enqueuePersistence(conversation.id, async () => {
      if (
        this.#conversationRevisions.get(conversation.id) !== revision ||
        this.#conversations.get(conversation.id) !== conversation
      ) {
        return
      }
      await repository.save(value)
    })
  }

  #enqueuePersistence(
    id: ConversationId,
    operation: () => Promise<void>,
  ): Promise<Error | undefined> {
    const previous = this.#persistenceQueues.get(id) ?? Promise.resolve(undefined)
    const queued = previous.then(operation).then(
      () => undefined,
      (cause) => {
        const source = toError(cause)
        const error = new A2AChatError("persistence-failed", source.message, { cause: source })
        this.#recordPersistenceError(error)
        return error
      },
    )
    this.#persistenceQueues.set(id, queued)
    void queued.then(() => {
      if (this.#persistenceQueues.get(id) === queued) this.#persistenceQueues.delete(id)
    })
    return queued
  }

  #recordPersistenceError(error: Error): void {
    this.#persistenceError = error
    this.#publish()
  }

  #createSnapshot(revision: number): RuntimeSnapshot {
    return Object.freeze({
      connection: this.#connection,
      conversations: Object.freeze([...this.#conversations.values()]),
      persistenceError: this.#persistenceError,
      revision,
    })
  }

  #publish(): void {
    this.#snapshot = this.#createSnapshot(this.#snapshot.revision + 1)
    for (const listener of this.#listeners) listener()
  }
}

type ExtensionTransport = Transport & {
  callExtensionMethod<Params, Response extends JSONRPCResponse>(
    method: string,
    params: Params,
    idOverride: number,
    options?: RequestOptions,
  ): Promise<Response>
}

function supportsExtensionMethods(transport: Transport): transport is ExtensionTransport {
  return (
    "callExtensionMethod" in transport &&
    typeof (transport as { callExtensionMethod?: unknown }).callExtensionMethod === "function"
  )
}

async function waitForDelay(delayMs: number, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) return false
  if (delayMs === 0) {
    await Promise.resolve()
    return !signal.aborted
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort)
      resolve(true)
    }, delayMs)
    const onAbort = () => {
      clearTimeout(timer)
      resolve(false)
    }
    signal.addEventListener("abort", onAbort, { once: true })
  })
}
