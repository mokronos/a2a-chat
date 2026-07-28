import { HttpApiBuilder, HttpServer } from "@effect/platform"
import {
    type A2AClientCredentialPolicy,
    A2AProxyModule,
    type A2ATargetDefinition,
    CoreHandlers,
    InspectorApi,
} from "@mokronos/a2a-chat-api"
import { Layer } from "effect"

// Vercel serverless entry for the inspector proxy. It answers every
// /api/a2a/* route (agent-card, jsonrpc) with the same Effect web handler the
// standalone Bun server uses, so proxy policy, DNS pinning, and SSE streaming
// behave identically in both deployments.

function parseJsonEnv(name: string): unknown {
    const raw = process.env[name]?.trim()
    if (!raw) return undefined
    try {
        return JSON.parse(raw)
    } catch {
        throw new TypeError(`${name} must be valid JSON`)
    }
}

/**
 * Opt-in translation for a credential the browser holds: `bearer` sends it as
 * `Authorization: Bearer …`, `header:<Name>` sends it verbatim under that name.
 */
function readClientCredential(): A2AClientCredentialPolicy | undefined {
    const configured = process.env.A2A_TARGET_CLIENT_AUTH?.trim()
    if (!configured) return undefined
    if (configured === "bearer") return { kind: "bearer" }

    const [prefix, ...rest] = configured.split(":")
    const name = rest.join(":").trim()
    if (prefix !== "header" || !name) {
        throw new TypeError('A2A_TARGET_CLIENT_AUTH must be "bearer" or "header:<Header-Name>"')
    }
    return { kind: "header", name }
}

function readTargets(): Record<string, A2ATargetDefinition> {
    const configured = parseJsonEnv("A2A_TARGETS")
    if (configured !== undefined) {
        if (typeof configured !== "object" || configured === null || Array.isArray(configured)) {
            throw new TypeError("A2A_TARGETS must be a JSON object keyed by target ID")
        }
        return configured as Record<string, A2ATargetDefinition>
    }

    const baseUrl = process.env.A2A_TARGET_URL?.trim()
    if (!baseUrl) {
        throw new TypeError("Set A2A_TARGET_URL (or A2A_TARGETS) to the upstream A2A agent")
    }

    const headers = parseJsonEnv("A2A_TARGET_HEADERS")
    if (headers !== undefined && (typeof headers !== "object" || headers === null || Array.isArray(headers))) {
        throw new TypeError("A2A_TARGET_HEADERS must be a JSON object of header names to values")
    }

    // The bundled inspector selects the `local` target ID.
    return {
        local: {
            baseUrl,
            headers: headers as Record<string, string> | undefined,
            clientCredential: readClientCredential(),
        },
    }
}

function buildHandler(): (request: Request) => Promise<Response> {
    const ProxyLive = A2AProxyModule.layer({
        targets: readTargets(),
        allowPrivateAddresses: process.env.A2A_ALLOW_PRIVATE_ADDRESSES === "true",
    })
    const HandlersLive = CoreHandlers.pipe(Layer.provide(ProxyLive))
    const InspectorApiLive = HttpApiBuilder.api(InspectorApi).pipe(Layer.provide(HandlersLive))
    const { handler } = HttpApiBuilder.toWebHandler(
        Layer.mergeAll(InspectorApiLive, HttpServer.layerContext),
    )
    return handler
}

let cached: ((request: Request) => Promise<Response>) | undefined

async function proxy(request: Request): Promise<Response> {
    try {
        cached ??= buildHandler()
    } catch (cause) {
        return Response.json(
            {
                _tag: "ProxyMisconfigured",
                code: "target_configuration_invalid",
                message: cause instanceof Error ? cause.message : "The proxy target configuration is invalid",
            },
            { status: 503 },
        )
    }

    return cached(request)
}

// Vercel reads a default export as the Node `(req, res)` signature and ignores
// anything it returns; named method exports get the Web Request/Response one.
export const GET = proxy
export const POST = proxy
