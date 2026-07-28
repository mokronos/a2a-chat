# @mokronos/a2a-chat-api

Production-safe server-side A2A proxy endpoints built with Effect and `@effect/platform`'s `HttpApi`.

The proxy exposes target IDs, never caller-selected production URLs:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/a2a/agent-card?targetId=<id>` | Fetch the configured target's agent card |
| `POST` | `/api/a2a/jsonrpc?targetId=<id>` | Proxy JSON-RPC and SSE traffic to the configured target |

`GET /` remains the health check.

## Security Model

`A2AProxyModule.layer({ targets })` is the production default. The server owns every URL and the browser only selects an allowlisted ID.

For every initial request and redirect, the module:

- accepts only absolute `http:` and `https:` URLs without credentials or fragments;
- resolves DNS and rejects any private, loopback, link-local, standard IPv4-translated, multicast, or non-routable IPv4 or IPv6 answer;
- uses `redirect: "manual"`, checks every redirect against the target policy, and DNS-validates every hop;
- forwards only explicitly allowlisted client headers (`Accept` and `Content-Type` by default);
- never accepts client `Authorization`, `Cookie`, proxy authorization, host, or hop-by-hop headers;
- injects server-owned target headers only on the original origin, preventing credential leakage through redirects;
- forwards only explicitly allowlisted response headers and always strips `Set-Cookie`, credentials, and hop-by-hop headers;
- bounds request, agent-card, buffered response, and streaming response bytes;
- propagates Effect interruption and client aborts to the upstream `AbortSignal`;
- streams SSE with backpressure instead of buffering it.

The default Node/Bun HTTP(S) adapter pins each connection to a DNS-validated address while preserving the URL hostname for HTTP Host and TLS SNI. Custom fetch adapters receive all validated addresses and are responsible for equivalent pinning.

## Install

```bash
bun add @mokronos/a2a-chat-api effect @effect/platform
```

Add the platform runtime used by your server, such as `@effect/platform-bun`.

## Production Usage

```ts
import {
  A2AProxyModule,
  CoreHandlers,
  InspectorApi,
} from "@mokronos/a2a-chat-api"
import { HttpApiBuilder, HttpServer } from "@effect/platform"
import { Layer } from "effect"

const ProxyLive = A2AProxyModule.layer({
  targets: {
    support: {
      baseUrl: "https://agent.example.com/a2a",
      // Optional overrides; these default to baseUrl and its agent-card path.
      jsonRpcUrl: "https://agent.example.com/a2a/jsonrpc",
      agentCardUrl: "https://agent.example.com/a2a/.well-known/agent-card.json",
      // These values are server-owned and are never accepted from the browser.
      headers: {
        authorization: `Bearer ${process.env.AGENT_TOKEN}`,
      },
      // Cross-origin redirects are denied unless their exact origin is listed.
      allowedRedirectOrigins: ["https://agent-cdn.example.com"],
      // Opt in to a credential the browser holds. It arrives in the neutral
      // `x-a2a-credential` header and is translated here, so it can never be
      // aimed at a target that did not ask for it. Omit for server-owned auth.
      clientCredential: { kind: "bearer" }, // or { kind: "header", name: "X-API-Key" }
    },
  },
})

const HandlersLive = CoreHandlers.pipe(Layer.provide(ProxyLive))
const ApiLive = HttpApiBuilder.api(InspectorApi).pipe(Layer.provide(HandlersLive))
const ApiLayer = Layer.mergeAll(ApiLive, HttpServer.layerContext)
const { handler } = HttpApiBuilder.toWebHandler(ApiLayer)

Bun.serve({
  port: 8000,
  fetch: (request) => handler(request),
})
```

Clients use only the configured ID:

```ts
await fetch("/api/a2a/jsonrpc?targetId=support", {
  method: "POST",
  headers: {
    accept: "text/event-stream",
    "content-type": "application/json",
  },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "message/send" }),
})
```

## Configuration

The secure defaults are:

| Option | Default |
| --- | ---: |
| `maxRedirects` | 3 |
| `requestTimeoutMs` | 10,000 |
| `maxRequestBytes` | 1 MiB |
| `maxAgentCardBytes` | 256 KiB |
| `maxResponseBytes` | 8 MiB |
| `maxStreamingResponseBytes` | 64 MiB |
| `streamIdleTimeoutMs` | 60,000 |

Override limits and safe header allowlists at module construction:

```ts
const ProxyLive = A2AProxyModule.layer({
  targets,
  limits: {
    requestTimeoutMs: 5_000,
    maxRequestBytes: 256 * 1024,
  },
  headers: {
    request: ["accept", "content-type", "x-request-id"],
    response: ["content-type", "cache-control", "x-request-id"],
  },
})
```

Sensitive and hop-by-hop headers cannot be added to client allowlists. Target-specific `headers` are the only way to inject upstream authorization or cookies.

For deeper integration, supply the `policy`, `dnsResolver`, or `fetchAdapter` interfaces instead of `targets`. The fetch adapter receives the operation, target ID, redirect count, validated URL, validated DNS addresses, and an interruption-aware request init.

## Development URLs

Caller-provided URLs require an explicit development-only policy. They remain HTTP(S)-only, same-origin across redirects, and subject to DNS checks.

```ts
import { A2AProxyModule, A2AProxyPolicy } from "@mokronos/a2a-chat-api"

const DevelopmentProxyLive = A2AProxyModule.layer({
  policy: A2AProxyPolicy.developmentUrls(),
  // Required only when intentionally testing agents on localhost/private networks.
  allowPrivateAddresses: true,
})
```

Do not use this policy in production. With it enabled, `targetId` is interpreted as the complete development URL.

## Errors

Policy and proxy failures use typed JSON responses:

| Status | Type | Examples |
| --- | --- | --- |
| `400` | `ProxyBadRequest` | Missing target ID, malformed development URL |
| `403` | `ProxyForbidden` | Unknown target ID, blocked address, disallowed redirect |
| `413` | `ProxyPayloadTooLarge` | Request body exceeds its configured limit |
| `502` | `ProxyBadGateway` | DNS/fetch failure, invalid redirect, oversized upstream body |
| `504` | `ProxyGatewayTimeout` | Upstream did not respond within the configured timeout |

Each response includes a stable `code` and a safe human-readable `message`.
