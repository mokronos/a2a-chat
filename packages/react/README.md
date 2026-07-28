# @mokronos/a2a-react

Headless React state and runtime orchestration for the A2A protocol. The package manages connections, concurrent turns, streaming task events, cancellation, recovery, push configuration, extensions, and optional conversation persistence without prescribing UI.

## Install

```bash
bun add @mokronos/a2a-react @a2a-js/sdk react
```

## Provider

```tsx
import {
  A2AChatProvider,
  useA2AChat,
  type ConversationId,
} from "@mokronos/a2a-react"

const conversationId = "support" as ConversationId

export function App() {
  return (
    <A2AChatProvider
      target={{ kind: "direct", baseUrl: "https://agent.example" }}
      autoConnect
      recovery={{ attempts: 3, delayMs: 250 }}
    >
      <Chat conversationId={conversationId} />
    </A2AChatProvider>
  )
}

function Chat({ conversationId }: { conversationId: ConversationId }) {
  const { connection, conversations, sendText, cancel } = useA2AChat()
  const conversation = conversations.find((item) => item.id === conversationId)

  return (
    <main>
      <p>Connection: {connection.kind}</p>
      <button
        onClick={() => sendText({ conversationId, text: "Hello" })}
        disabled={connection.kind !== "connected"}
      >
        Send
      </button>
      {conversation?.turns.map((turn) => (
        <button key={turn.id} onClick={() => cancel(turn.id)}>
          {turn.lifecycle.kind}
        </button>
      ))}
    </main>
  )
}
```

`UseA2AChatOptions` accepts all `RuntimeOptions` plus `target` and `autoConnect`. Options are captured when the controller mounts. Use the returned commands for connection changes, or change the provider's React `key` to construct a runtime with different authentication, repository, recovery, or client-factory options.

## Connection Targets

```ts
type ConnectionTarget =
  | { kind: "direct"; baseUrl: string }
  | { kind: "proxy"; targetId: string; basePath?: string }
  | { kind: "client"; client: Client; card?: AgentCard }
```

Direct targets resolve the agent card and select an advertised JSON-RPC or HTTP+JSON transport. Proxy targets use `<basePath>/agent-card?targetId=...` and `<basePath>/jsonrpc?targetId=...`. Injected clients are accepted as-is. Required card extensions are checked for every target kind against `supportedExtensionUris`.

## Agent Credentials

When a connected agent card declares a `bearer` or header `apiKey` scheme, the runtime
publishes it as `auth.requirement` and reports `auth.status` (`required`, `provided`,
`accepted`, `rejected`). Pass the user's secret to `setCredential`; it rides on every
request afterwards — in `x-a2a-credential` for proxy targets, or in the card's own header
for direct ones — and a 401 or 403 flips the status to `rejected`.

```tsx
const { auth, setCredential } = useA2AChat()

if (auth.status === "required") return <TokenPrompt onSubmit={setCredential} />
```

Credentials are kept per target in `sessionStorage`; pass `credentialStorage` to choose
another store, or `null` to keep them in memory only.

## Hook API

`useA2AChat()` and `useA2AChatController()` return:

```ts
type A2AChat = {
  readonly connection: ConnectionState
  readonly conversations: readonly Conversation[]
  readonly auth: AuthState
  readonly persistenceError?: Error
  readonly runtime: A2AChatRuntime

  connect(target: ConnectionTarget): Promise<ConnectedState>
  disconnect(): DisconnectResult
  setCredential(value: string | undefined): void
  clearCredential(): void
  createConversation(id?: ConversationId): Conversation
  getConversation(id: ConversationId): Conversation | undefined
  deleteConversation(id: ConversationId): Promise<DeleteConversationResult>
  loadConversation(id: ConversationId): Promise<LoadConversationResult>

  send(command: SendCommand): Promise<TurnId>
  sendText(command: Omit<SendCommand, "parts"> & { text: string }): Promise<TurnId>
  respondToInput(input: {
    conversationId: ConversationId
    turnId: TurnId
    parts: Part[]
    configuration?: MessageSendConfiguration
  }): Promise<TurnId>
  cancel(turnId: TurnId): Promise<CancelResult>
  getTask(params: GetTaskParams, options?: RequestOptions): Promise<Task>
  resubscribe(turnId: TurnId, options?: RecoveryOptions): Promise<ResubscribeResult>

  setPushNotification(params: SetPushNotificationParams, options?: RequestOptions): Promise<TaskPushNotificationConfig>
  getPushNotification(params: GetPushNotificationParams, options?: RequestOptions): Promise<TaskPushNotificationConfig>
  listPushNotifications(params: ListPushNotificationsParams, options?: RequestOptions): Promise<TaskPushNotificationConfig[]>
  deletePushNotification(params: DeletePushNotificationParams, options?: RequestOptions): Promise<void>
  getAuthenticatedExtendedCard(options?: RequestOptions): Promise<AgentCard>
  callExtension<Params, Response extends JSONRPCResponse>(method: string, params: Params, options?: RequestOptions): Promise<Response>
}
```

The push parameter aliases are derived directly from the installed SDK `Client` methods. `CancelResult`, `LoadConversationResult`, `DeleteConversationResult`, and `ResubscribeResult` are discriminated unions. Command precondition failures use `A2AChatError` with an `A2AChatErrorCode`.

## Runtime

`A2AChatRuntime` exposes the same commands without React. `subscribe` and `getSnapshot` follow the `useSyncExternalStore` contract: snapshots are cached between changes and replaced for every published asynchronous update.

Nonterminal stream closure enters `recovering`, retries resubscription with bounded exponential delay, and enters an explicit `waiting` state if retries are exhausted. Input-required and auth-required states stop recovery. Disconnecting preserves nonterminal turns as waiting; reconnecting resumes eligible tasks.

## Persistence

Provide a `ConversationRepository` through `repository`. The package includes `MemoryConversationRepository` and an SSR-safe `LocalStorageConversationRepository`. Call `loadConversation(id)` to hydrate a conversation. Loads that race with a newer local mutation return `{ kind: "stale" }`; persisted nonterminal tasks resume when connected.

Stored values use a validated, versioned shape:

```ts
type PersistedConversation = {
  readonly version: 1
  readonly conversation: Conversation
  readonly savedAt: number
}
```

Repository save failures are captured in `persistenceError` rather than becoming unhandled promise rejections.
