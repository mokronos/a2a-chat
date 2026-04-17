# Chat UI

A component for a simple A2A chat box.

## Usage

```tsx
import { A2AChat } from "@mokronos/a2a-chat-ui"
import "@mokronos/a2a-chat-ui/styles.css"

export function App() {
  return <A2AChat />
}
```

`A2AChat` uses a proxy transport. Your frontend should expose:

- `GET /api/a2a/agent-card?target=<a2aBaseUrl>`
- `POST /api/a2a/jsonrpc?target=<jsonRpcEndpoint>`

### Props

- `proxyBasePath?: string` (default: `/api/a2a`)
- `initialUrl?: string` (default: `http://localhost`)
- `autoConnect?: boolean` (default: `false`)
- `showConnectionForm?: boolean` (default: `true`)
- `agentSuggestions?: Array<{ label: string; url: string; description?: string }>`
