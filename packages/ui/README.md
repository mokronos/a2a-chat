# @mokronos/a2a-chat-ui

Styled React components for chatting with [A2A](https://a2a-protocol.org/) agents. Built on the headless [`@mokronos/a2a-react`](https://www.npmjs.com/package/@mokronos/a2a-react) — it brings the protocol logic, this package brings the UI.

Two ways to use it: drop in the batteries-included `A2AChat` preset, or compose the individual primitives inside an `A2AChatProvider`.

## Install

```bash
bun add @mokronos/a2a-react @mokronos/a2a-chat-ui
```

Always import the stylesheet once:

```tsx
import "@mokronos/a2a-chat-ui/styles.css"
```

## 1. Batteries included

One component that owns the default layout (connection form, message list, task sidebar, input):

```tsx
import { A2AChat } from "@mokronos/a2a-chat-ui"
import "@mokronos/a2a-chat-ui/styles.css"

export function ChatPage() {
  return (
    <A2AChat
      initialUrl="http://localhost:8000"
      proxyBasePath="/api/a2a"
      autoConnect
      layout="panel"
      fillHeight
    />
  )
}
```

### Key `A2AChat` props

Connection props (`initialUrl`, `proxyBasePath`, `autoConnect`, `persistence`) are passed straight through to `A2AChatProvider`. On top of those:

| Prop | Type | Description |
| --- | --- | --- |
| `layout` | `"default" \| "panel"` | Overall layout. |
| `fillHeight` | `boolean` | Fill the parent's height. |
| `collapsibleSidebar` | `boolean` | Let the task sidebar collapse to a rail (default layout). |
| `showHeader` / `showConnectionForm` / `showConnectionStatus` / `showTaskSessions` | `boolean` | Toggle chrome. |
| `title` / `description` / `welcomeMessage` / `inputPlaceholder` | `string` | Copy. |
| `agentSuggestions` | `A2AAgentSuggestion[]` | Quick-connect agent shortcuts. |
| `promptSuggestions` | `A2AChatPromptSuggestion[]` | Starter prompts. |
| `eventRenderers` | `MessageTimelineEventRenderer[]` | Custom renderers for timeline events. |
| `className` / `contentClassName` / `messagesClassName` | `string` | Style hooks. |

## 2. Composable primitives

Arrange the pieces yourself inside an `A2AChatProvider` (re-exported here for convenience):

```tsx
import { A2AChatProvider } from "@mokronos/a2a-chat-ui"
import { A2AInput, A2AMessages, A2ATaskList } from "@mokronos/a2a-chat-ui"
import "@mokronos/a2a-chat-ui/styles.css"

export function ChatPage() {
  return (
    <A2AChatProvider initialUrl="http://localhost:8000" proxyBasePath="/api/a2a" autoConnect>
      <aside>
        <A2ATaskList />
      </aside>
      <main>
        <A2AMessages maxWidth="3xl" />
        <A2AInput placeholder="Ask anything" />
      </main>
    </A2AChatProvider>
  )
}
```

Available primitives: `A2AConnectionForm`, `A2AConnectionStatus`, `A2AConnectionBar`, `A2AEmptyState`, `A2AMessages`, `A2AInput`, `A2APromptSuggestions` / `A2APromptSuggestion`, `A2ATaskList`. The `inspectorEventRenderers` export and `MessageTimelineEventRenderer` type let you customize how timeline events are rendered.

For a fully custom layout, skip these and read state directly with `useA2AChat` (also re-exported here, or from `@mokronos/a2a-react`).

## The proxy

`proxyBasePath` makes the client route A2A traffic through your server instead of hitting the agent directly:

- `GET <proxyBasePath>/agent-card?target=<a2aBaseUrl>`
- `POST <proxyBasePath>/jsonrpc?target=<jsonRpcEndpoint>`

[`@mokronos/a2a-chat-api`](https://www.npmjs.com/package/@mokronos/a2a-chat-api) implements these endpoints for an Effect server.

## Part of a2a-chat

| Package | Provides |
| --- | --- |
| [`@mokronos/a2a-react`](https://www.npmjs.com/package/@mokronos/a2a-react) | Headless React state and A2A orchestration |
| **`@mokronos/a2a-chat-ui`** | This package — styled components and the `A2AChat` preset |
| [`@mokronos/a2a-chat-api`](https://www.npmjs.com/package/@mokronos/a2a-chat-api) | Server-side A2A proxy endpoints |
