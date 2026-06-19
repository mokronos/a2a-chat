# a2a-chat

React building blocks for adding an A2A agent chat to a frontend.

The repo is split into three package layers:

| Package | Provides | Install when |
| --- | --- | --- |
| `@mokronos/a2a-react` | Headless React state: `A2AChatProvider`, `useA2AChat`, A2A message/session types, streaming/task orchestration | You want A2A chat logic with your own UI |
| `@mokronos/a2a-chat-ui` | Styled React components and a batteries-included `A2AChat` preset | You want ready-made chat UI components |
| `@mokronos/a2a-chat-api` | Server-side proxy/API helpers for agent-card and JSON-RPC forwarding | Your frontend needs a same-origin A2A proxy |

The headless package is installed as a normal dependency. UI components can be used from the package directly, or installed through the shadcn registry item in this repo as copyable components that depend on `@mokronos/a2a-react`.

## Usage

### 1. Headless Only

Use this when you want complete control over rendering.

```bash
bun add @mokronos/a2a-react
```

```tsx
import { A2AChatProvider, useA2AChat } from "@mokronos/a2a-react"

function Chat() {
  return (
    <A2AChatProvider initialUrl="http://localhost:8000" proxyBasePath="/api/a2a" autoConnect>
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

### 2. Styled Components

Use this when you want the A2A logic plus composable UI pieces.

```bash
bun add @mokronos/a2a-react @mokronos/a2a-chat-ui
```

```tsx
import { A2AChatProvider } from "@mokronos/a2a-react"
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

### 3. Batteries Included

Use this when you want one component that owns the default layout.

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

### 4. Server Proxy Helpers

Use this when browser clients should talk to your app server, and your app server forwards A2A traffic to the target agent.

```bash
bun add @mokronos/a2a-chat-api
```

The inspector app in `apps/server` uses `@mokronos/a2a-chat-api` to expose:

```txt
/api/a2a/agent-card?target=...
/api/a2a/jsonrpc?target=...
```

Then the frontend uses:

```tsx
<A2AChatProvider proxyBasePath="/api/a2a" />
```

## shadcn Distribution Model

`@mokronos/a2a-react` should be installed, not copied. It contains protocol behavior, streaming, task sessions, event normalization, cancellation, and SDK integration.

Styled UI files are the good candidates for shadcn-style copy/install workflows:

```txt
A2AMessages
A2AInput
A2ATaskList
A2AConnectionForm
A2AConnectionStatus
A2AEmptyState
custom event renderers
ai-elements primitives such as Conversation, Message, PromptInput, Tool, Task
```

A shadcn registry item can copy those files into an app and declare `@mokronos/a2a-react` as a dependency. That lets users customize rendering and styling while still receiving headless protocol fixes through normal dependency updates.

Install from this public GitHub repo after the registry file is merged to the default branch:

```bash
bunx shadcn add mokronos/a2a-chat/a2a-chat
```

Pin to a tag or commit for reproducible installs:

```bash
bunx shadcn add mokronos/a2a-chat/a2a-chat#v0.0.2
```

For local validation while developing this repo:

```bash
bun run registry:build
bunx shadcn add ./public/r/a2a-chat.json --dry-run --yes -c packages/ui
```

The registry item copies composable components only. The package-level `A2AChat` preset remains available from `@mokronos/a2a-chat-ui`.

## Publishing

Publish packages in dependency order:

```bash
bun run build:api
bun run build:react
bun run --cwd packages/ui build
npm publish --workspace packages/react --access public
npm publish --workspace packages/api --access public
npm publish --workspace packages/ui --access public
```

Before publishing, verify npm auth:

```bash
npm whoami
```

If it returns `401 Unauthorized`, run `npm login` or configure `NPM_TOKEN` first.

## Inspector Example

The local inspector app demonstrates the intended split:

```tsx
import { A2AChatProvider, useA2AChat } from "@mokronos/a2a-react"
import { A2AInput, A2AMessages, A2ATaskList } from "@mokronos/a2a-chat-ui"
```

Run it with:

```bash
bun install
bun run dev
```

## Development

Install dependencies:

```bash
bun install
```

Build the headless React package:

```bash
bun run build:react
```

Build the UI package:

```bash
bun run build:ui
```

Build the inspector/server app:

```bash
bun run build
```

Typecheck:

```bash
bun run typecheck
```

## Versioning GitHub Installs

When this repo is consumed directly from GitHub, pin the dependency to a Git tag instead of an unversioned branch:

```json
{
  "dependencies": {
    "a2a-chat": "github:mokronos/a2a-chat#v0.0.1"
  }
}
```

GitHub dependencies are locked to a commit in `bun.lock`, so pushing to this repo is not enough for another repo to receive changes. Cut a new version here, push the tag, then update the consuming repo to that tag.

```bash
bun run version:patch
git push --follow-tags
```

Use `bun run version:minor` or `bun run version:major` when the change warrants it.

To create a local package tarball for testing without publishing:

```bash
bun run pack:server
```

To run the packaged server locally with Bun:

```bash
bun run bunx:server
```

Or call `bunx` directly:

```bash
bunx --package a2a-chat-server@file:$PWD/apps/server a2a-chat-server
```

To run it through npm tooling, Bun must be installed because the CLI uses Bun server APIs:

```bash
npx --package ./apps/server a2a-chat-server
```
