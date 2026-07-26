# a2a-chat

A conversation-first React runtime, UI, and secure same-origin proxy for A2A agents.

## Packages

| Package | Purpose |
| --- | --- |
| `@mokronos/a2a-react` | Headless connection, conversation, streaming, recovery, and persistence runtime. |
| `@mokronos/a2a-chat-ui` | Scoped, accessible React UI with a drop-in `A2AChat` and composable conversation primitives. |
| `@mokronos/a2a-chat-api` | Effect HTTP API with an allowlisted, DNS-pinned A2A proxy. |

## Quick Start

Run the bundled agent and inspector in separate terminals:

```bash
cd apps/server/test-agent && uv run fast.py
```

```bash
bun install
bun run dev
```

Open `http://localhost:19999`. The inspector selects the server-owned `local` target; it never sends a user supplied URL to the proxy. Set `A2A_LOCAL_TARGET_URL` to point that target at another development agent.

## Use The Runtime

```tsx
import { A2AChatProvider, useA2AChat, type ConversationId } from "@mokronos/a2a-react"

function Composer({ conversationId }: { conversationId: ConversationId }) {
  const { sendText } = useA2AChat()
  return <button onClick={() => void sendText({ conversationId, text: "Hello" })}>Send</button>
}

<A2AChatProvider target={{ kind: "proxy", targetId: "support", basePath: "/api/a2a" }} autoConnect>
  <Composer conversationId={conversationId} />
</A2AChatProvider>
```

## Use The UI

```tsx
import { A2AChat } from "@mokronos/a2a-chat-ui"
import "@mokronos/a2a-chat-ui/styles.css"

<A2AChat
  target={{ kind: "proxy", targetId: "support", basePath: "/api/a2a" }}
  autoConnect
  allowDirectUrl={false}
  fillHeight
/>
```

For a custom layout, render `A2AChatRoot`, `ConversationList`, `A2AMessages`, and `A2AInput` inside `A2AChatProvider`. The latter two require an explicit `conversationId`.

## Secure Proxy

Configure server-owned target IDs. The browser may select an ID, but cannot select an upstream URL or inject upstream credentials.

```ts
const proxy = A2AProxyModule.layer({
  targets: {
    support: {
      baseUrl: "https://agent.example/a2a",
      headers: { authorization: `Bearer ${process.env.AGENT_TOKEN}` },
    },
  },
})
```

The proxy validates DNS addresses and redirects, pins requests to validated addresses, strips unsafe headers, bounds payloads, and streams SSE with backpressure. See `packages/api/README.md` for integration details.

## Development

```bash
bun install
bun test
bun run typecheck
bun run build
bun run registry:build
```

Validate the generated registry with:

```bash
bunx shadcn add ./public/r/a2a-chat.json --dry-run --yes -c packages/ui
```

Package release tags are `api-v<version>`, `react-v<version>`, and `ui-v<version>`. Packages must be released in dependency order: React before UI.
