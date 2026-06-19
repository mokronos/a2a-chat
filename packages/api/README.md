# @mokronos/a2a-chat-api

Server-side proxy helpers for [A2A](https://a2a-protocol.org/) agent traffic, built with [Effect](https://effect.website/) and `@effect/platform`'s `HttpApi`.

Browsers can't talk to most A2A agents directly (CORS, mixed content, hidden credentials). This package gives your app server a same-origin proxy so the frontend (e.g. [`@mokronos/a2a-react`](https://www.npmjs.com/package/@mokronos/a2a-react)) can forward A2A traffic through it.

It exposes two endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/a2a/agent-card?target=<a2aBaseUrl>` | Fetches the target agent's `/.well-known/agent-card.json` |
| `POST` | `/api/a2a/jsonrpc?target=<jsonRpcEndpoint>` | Forwards the JSON-RPC body to the target agent |

A health check is served at `GET /`. Only `http:`/`https:` targets are allowed; bad targets return `400`, unreachable targets return `502`.

## Install

```bash
bun add @mokronos/a2a-chat-api
```

Peers: `effect`, `@effect/platform` (and a platform runtime such as `@effect/platform-bun`).

## Usage

The package exports two pieces you wire together:

- `InspectorApi` — the `HttpApi` definition (route shapes).
- `CoreHandlers` — the `Layer` implementing those routes.

```ts
import { InspectorApi, CoreHandlers } from "@mokronos/a2a-chat-api"
import { HttpApiBuilder, HttpServer } from "@effect/platform"
import { Layer } from "effect"

const ApiLive = HttpApiBuilder.api(InspectorApi).pipe(Layer.provide(CoreHandlers))
const ApiLayer = Layer.mergeAll(ApiLive, HttpServer.layerContext)

// Turn it into a standard Web `fetch` handler...
const { handler } = HttpApiBuilder.toWebHandler(ApiLayer)

// ...and mount it under /api in your server.
Bun.serve({
  port: 8000,
  fetch: (request) => {
    const url = new URL(request.url)
    if (url.pathname.startsWith("/api/")) return handler(request)
    return new Response("Not found", { status: 404 })
  },
})
```

The frontend then points its proxy at the same base path:

```tsx
<A2AChatProvider proxyBasePath="/api/a2a" initialUrl="http://localhost:8000" autoConnect />
```

See `apps/server` in the [repo](https://github.com/mokronos/a2a-chat) for a complete reference server that also serves the inspector UI.

## Part of a2a-chat

| Package | Provides |
| --- | --- |
| [`@mokronos/a2a-react`](https://www.npmjs.com/package/@mokronos/a2a-react) | Headless React state and A2A orchestration |
| [`@mokronos/a2a-chat-ui`](https://www.npmjs.com/package/@mokronos/a2a-chat-ui) | Styled React components and the `A2AChat` preset |
| **`@mokronos/a2a-chat-api`** | This package — server-side A2A proxy endpoints |
