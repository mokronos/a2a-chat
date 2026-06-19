# @mokronos/a2a-react

Headless React state for chatting with [A2A](https://a2a-protocol.org/) agents. It owns the protocol behaviour — connecting to an agent, streaming responses, task sessions, event normalization, and cancellation — and leaves rendering entirely to you.

Use this when you want A2A chat logic with your own UI. For ready-made styled components, add [`@mokronos/a2a-chat-ui`](https://www.npmjs.com/package/@mokronos/a2a-chat-ui) on top.

## Install

```bash
bun add @mokronos/a2a-react
```

Peers: `react` (19+), `@tanstack/react-query`, `effect`, `@a2a-js/sdk`.

## Usage

Wrap your tree in `A2AChatProvider`, then read state and handlers anywhere below it with `useA2AChat`.

```tsx
import { A2AChatProvider, useA2AChat } from "@mokronos/a2a-react"

export function Chat() {
  return (
    <A2AChatProvider
      initialUrl="http://localhost:8000"
      proxyBasePath="/api/a2a"
      autoConnect
    >
      <CustomChat />
    </A2AChatProvider>
  )
}

function CustomChat() {
  const { messages, taskInput, setTaskInput, handleSubmitTask, isSending } = useA2AChat()

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmitTask()
      }}
    >
      {messages.map((message) => (
        <article key={message.id} data-role={message.role}>
          {message.text}
        </article>
      ))}
      <input value={taskInput} onChange={(event) => setTaskInput(event.target.value)} />
      <button disabled={isSending}>Send</button>
    </form>
  )
}
```

### `A2AChatProvider` props

| Prop | Type | Description |
| --- | --- | --- |
| `initialUrl` | `string` | Agent base URL to start from. |
| `proxyBasePath` | `string \| false` | Path your server proxies A2A traffic on (see below). `false` to talk to the agent directly. |
| `autoConnect` | `boolean` | Connect to `initialUrl` on mount. |
| `persistence` | `A2AChatPersistenceAdapter` | Optional adapter to load/save task sessions. |

### `useA2AChat()`

Returns the live chat state and handlers. Must be called inside an `A2AChatProvider`. Highlights:

- **Connection** — `url`, `setUrl`, `connectionState`, `connectionMessage`, `agentName`, `handleConnect`, `recentAgents`, `handleSelectRecentAgent`.
- **Messaging** — `messages`, `taskInput`, `setTaskInput`, `isSending`, `handleSubmitTask(textOverride?)`, `handleCancelTask`.
- **Task sessions** — `taskSessions`, `activeTaskSessionId`, `handleCreateTaskSession`, `handleSelectTaskSession`, `handleDeleteTaskSession`.

Exported types include `Message`, `MessageTimelineEvent`, `MessageStatusHistoryEntry`, `ConnectionState`, `UseA2AChatResult`, `A2AChatPersistenceAdapter`, and `PersistedTaskSession`.

## The proxy

When `proxyBasePath` is set, requests go to your server instead of the agent directly:

```txt
GET  <proxyBasePath>/agent-card?target=<a2aBaseUrl>
POST <proxyBasePath>/jsonrpc?target=<jsonRpcEndpoint>
```

[`@mokronos/a2a-chat-api`](https://www.npmjs.com/package/@mokronos/a2a-chat-api) implements exactly these endpoints for an Effect/`@effect/platform` server.

## Part of a2a-chat

| Package | Provides |
| --- | --- |
| **`@mokronos/a2a-react`** | This package — headless React state and A2A orchestration |
| [`@mokronos/a2a-chat-ui`](https://www.npmjs.com/package/@mokronos/a2a-chat-ui) | Styled React components and the `A2AChat` preset |
| [`@mokronos/a2a-chat-api`](https://www.npmjs.com/package/@mokronos/a2a-chat-api) | Server-side A2A proxy endpoints |
