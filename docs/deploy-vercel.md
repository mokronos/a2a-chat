# Deploy The Inspector To Vercel

The inspector runs on Vercel as a static bundle plus one serverless function:

| Piece | Source | Deployed as |
| --- | --- | --- |
| Inspector SPA | `apps/server/web`, built into `apps/server/public` | Static output |
| A2A proxy | `api/a2a/[...route].ts` (wraps `@mokronos/a2a-chat-api`) | Node function on `/api/a2a/*` |

`vercel.json` at the repository root wires both together, so the Vercel project's
**Root Directory must stay at the repository root** (not `apps/server`).

## Required Configuration

The proxy never accepts a browser-supplied upstream URL (see
[ADR 0001](adr/0001-secure-target-registry.md)); it resolves server-owned target IDs.
The bundled inspector selects the target ID `local`.

| Environment variable | Required | Purpose |
| --- | --- | --- |
| `A2A_TARGET_URL` | Yes (unless `A2A_TARGETS` is set) | Public HTTPS base URL of the upstream agent, exposed as target `local`. |
| `A2A_TARGET_HEADERS` | No | JSON object of headers injected upstream, e.g. `{"authorization":"Bearer …"}`. |
| `A2A_TARGET_CLIENT_AUTH` | No | Lets the browser supply the agent credential: `bearer`, or `header:<Header-Name>`. See [Browser-held credentials](#browser-held-credentials). |
| `A2A_TARGETS` | No | JSON object of full target definitions; overrides the two variables above. Must define a `local` target for the bundled UI. |
| `A2A_ALLOW_PRIVATE_ADDRESSES` | No | `true` lets targets resolve to private/loopback addresses. Leave unset in production. |

The agent must be reachable from Vercel's network over the public internet — a
`localhost` agent cannot work, and private addresses are rejected by default.

`A2A_TARGETS` example:

```json
{
  "local": {
    "baseUrl": "https://agent.example.com/a2a",
    "headers": { "authorization": "Bearer ${TOKEN}" },
    "allowedRedirectOrigins": ["https://agent-cdn.example.com"]
  }
}
```

## Browser-Held Credentials

A credential can belong to the deployment or to the person using the inspector:

- **Deployment-owned** — put it in `A2A_TARGET_HEADERS`. The browser sends nothing and
  anyone who can load the page can talk to the agent.
- **User-held** — set `A2A_TARGET_CLIENT_AUTH`. The inspector reads the agent card's
  `securitySchemes`, prompts for the secret, and sends it in `x-a2a-credential`; the
  proxy translates it into the header the target opted in to. Nothing is stored
  server-side, and the secret lives in the browser's `sessionStorage`.

Only a target that opts in ever receives a browser credential, and it is dropped on any
redirect that leaves the target's origin. See
[ADR 0003](adr/0003-browser-held-agent-credentials.md).

## Deploy

```bash
bun x vercel@latest link      # pick or create the project, root directory = repo root
bun x vercel@latest env add A2A_TARGET_URL production
bun x vercel@latest deploy --prod
```

The CLI uploads the working tree, so a deploy reflects local changes, committed or not.

Vercel reads the build settings from `vercel.json`:

- Install: `NODE_ENV=development bun install --frozen-lockfile` — the build tooling
  (tsup, Tailwind, React) lives in `devDependencies`, so a production install would drop it.
- Build: `bun run --cwd apps/server build:web` — builds `api`, `react`, and `ui`, then
  bundles the SPA. `NODE_ENV=production` on Vercel also minifies the bundle.
- Output: `apps/server/public`.

## Notes

- The proxy exports named `GET`/`POST` handlers. A default export would be read as
  Vercel's Node `(req, res)` signature, whose return value is ignored — requests hang.
- `maxDuration` is set to 300s for the proxy function so long SSE streams survive.
  Lower it if the account's plan caps function duration below that.
- Assets are fingerprint-free (`app.js`, `styles.css`), so they are served with
  `cache-control: public, max-age=0, must-revalidate` and revalidate via ETag.
- To keep the deployment private, enable Vercel Deployment Protection on the project;
  the inspector page itself has no authentication — `A2A_TARGET_CLIENT_AUTH` protects the
  agent behind it, not the page.

## Deploying The Test Agent

`apps/server/test-agent` deploys as its own Vercel project (Root Directory =
`apps/server/test-agent`), exposing the FastA2A app through `api/index.py`.

| Environment variable | Required | Purpose |
| --- | --- | --- |
| `OPENCODE_ZEN_API_KEY` | Yes | Model provider key the agent runs on. |
| `A2A_API_TOKEN` | No | Shared bearer token. When set, the agent advertises it on the card and rejects unauthenticated JSON-RPC with 401. Unset means an open agent, which is what local development wants. |
| `A2A_PUBLIC_URL` | No | The deployment's own URL. It fills the agent card and the delegation demo's peer address; defaults to `http://localhost:8000`. |
| `A2A_PEER_URL` | No | Overrides the agent used by the `send_task` delegation demo. |

The agent card stays public so a client can discover the scheme before it has a token.

Two constraints the Vercel Python runtime imposes:

- Dependencies install from `pyproject.toml`, not `requirements.txt`. `pydantic-ai` is
  pinned there because its `run_stream_events` became a context manager after 1.84.
- Storage is in-memory per instance, so conversation context survives only as long as
  Vercel reuses a warm instance. It is a demo agent, not a durable one.
