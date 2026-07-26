import { Effect } from "effect"

import { ProxyBadRequest, ProxyForbidden } from "./errors"

export type A2AProxyOperation = "agentCard" | "jsonrpc"

export interface A2ATargetDefinition {
    readonly baseUrl: string | URL
    readonly agentCardUrl?: string | URL
    readonly jsonRpcUrl?: string | URL
    readonly headers?: Readonly<Record<string, string>>
    readonly allowedRedirectOrigins?: ReadonlyArray<string | URL>
}

export interface ResolvedA2ATarget {
    readonly id: string
    readonly agentCardUrl: URL
    readonly jsonRpcUrl: URL
    readonly headers: Readonly<Record<string, string>>
}

export interface A2AProxyPolicy {
    readonly resolve: (
        targetId: string,
    ) => Effect.Effect<ResolvedA2ATarget, ProxyBadRequest | ProxyForbidden>
    readonly authorize: (input: {
        readonly target: ResolvedA2ATarget
        readonly operation: A2AProxyOperation
        readonly url: URL
        readonly redirectCount: number
    }) => Effect.Effect<void, ProxyForbidden>
}

const forbiddenInjectedHeaders = new Set([
    "connection",
    "content-length",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "set-cookie",
    "set-cookie2",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
])

function parseHttpUrl(value: string | URL, label: string): URL {
    const input = value instanceof URL ? value.toString() : value
    if (input.trim() !== input) {
        throw new TypeError(`${label} must not contain surrounding whitespace`)
    }

    let url: URL
    try {
        url = new URL(input)
    } catch {
        throw new TypeError(`${label} must be an absolute URL`)
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new TypeError(`${label} must use http or https`)
    }
    if (url.username || url.password) {
        throw new TypeError(`${label} must not contain credentials`)
    }
    if (url.hash) {
        throw new TypeError(`${label} must not contain a fragment`)
    }

    return url
}

function parseDevelopmentUrl(value: string): Effect.Effect<URL, ProxyBadRequest> {
    return Effect.try({
        try: () => parseHttpUrl(value, "targetId"),
        catch: (cause) =>
            new ProxyBadRequest({
                code: "invalid_development_url",
                message: cause instanceof Error ? cause.message : "targetId must be a valid URL",
            }),
    })
}

function validateHeaders(
    targetId: string,
    input: Readonly<Record<string, string>> | undefined,
): Readonly<Record<string, string>> {
    const headers: Record<string, string> = {}
    for (const [rawName, value] of Object.entries(input ?? {})) {
        const name = rawName.toLowerCase()
        if (forbiddenInjectedHeaders.has(name)) {
            throw new TypeError(`Target '${targetId}' cannot inject the '${rawName}' header`)
        }

        try {
            const validated = new Headers()
            validated.set(name, value)
            headers[name] = validated.get(name)!
        } catch {
            throw new TypeError(`Target '${targetId}' has an invalid '${rawName}' header`)
        }
    }
    return Object.freeze(headers)
}

export function resolveAgentCardUrl(targetUrl: URL): URL {
    const targetBase = new URL(targetUrl)
    if (!targetBase.pathname.endsWith("/")) {
        targetBase.pathname += "/"
    }
    return new URL(".well-known/agent-card.json", targetBase)
}

function configuredTargets(
    definitions: Readonly<Record<string, A2ATargetDefinition>>,
): A2AProxyPolicy {
    const targets = new Map<
        string,
        {
            readonly target: ResolvedA2ATarget
            readonly allowedOrigins: Readonly<Record<A2AProxyOperation, ReadonlySet<string>>>
        }
    >()

    for (const [id, definition] of Object.entries(definitions)) {
        if (id.length === 0 || id.length > 2_048 || id.trim() !== id) {
            throw new TypeError("Target IDs must be 1-2048 characters without surrounding whitespace")
        }

        const baseUrl = parseHttpUrl(definition.baseUrl, `Target '${id}' baseUrl`)
        const agentCardUrl = definition.agentCardUrl
            ? parseHttpUrl(definition.agentCardUrl, `Target '${id}' agentCardUrl`)
            : resolveAgentCardUrl(baseUrl)
        const jsonRpcUrl = definition.jsonRpcUrl
            ? parseHttpUrl(definition.jsonRpcUrl, `Target '${id}' jsonRpcUrl`)
            : new URL(baseUrl)
        const redirectOrigins = (definition.allowedRedirectOrigins ?? []).map((origin) =>
            parseHttpUrl(origin, `Target '${id}' redirect origin`).origin
        )
        const target: ResolvedA2ATarget = Object.freeze({
            id,
            agentCardUrl,
            jsonRpcUrl,
            headers: validateHeaders(id, definition.headers),
        })

        targets.set(id, {
            target,
            allowedOrigins: {
                agentCard: new Set([agentCardUrl.origin, ...redirectOrigins]),
                jsonrpc: new Set([jsonRpcUrl.origin, ...redirectOrigins]),
            },
        })
    }

    return {
        resolve: (targetId) => {
            const configured = targets.get(targetId)
            return configured
                ? Effect.succeed(Object.freeze({
                    ...configured.target,
                    agentCardUrl: new URL(configured.target.agentCardUrl),
                    jsonRpcUrl: new URL(configured.target.jsonRpcUrl),
                }))
                : Effect.fail(
                    new ProxyForbidden({
                        code: "target_not_allowed",
                        message: "The requested target ID is not allowed",
                    }),
                )
        },
        authorize: ({ target, operation, url, redirectCount }) => {
            const configured = targets.get(target.id)
            const expectedUrl = operation === "agentCard"
                ? configured?.target.agentCardUrl
                : configured?.target.jsonRpcUrl
            const isExpectedInitialUrl = redirectCount > 0 || expectedUrl?.href === url.href
            const isAllowedOrigin = configured?.allowedOrigins[operation].has(url.origin) === true

            return isExpectedInitialUrl && isAllowedOrigin
                ? Effect.void
                : Effect.fail(
                    new ProxyForbidden({
                        code: "redirect_not_allowed",
                        message: "The upstream redirect target is not allowed by policy",
                    }),
                )
        },
    }
}

function developmentUrls(): A2AProxyPolicy {
    return {
        resolve: (targetId) =>
            parseDevelopmentUrl(targetId).pipe(
                Effect.map((baseUrl) => ({
                    id: targetId,
                    agentCardUrl: resolveAgentCardUrl(baseUrl),
                    jsonRpcUrl: new URL(baseUrl),
                    headers: {},
                })),
            ),
        authorize: ({ target, operation, url, redirectCount }) => {
            const expectedUrl = operation === "agentCard" ? target.agentCardUrl : target.jsonRpcUrl
            const isExpectedInitialUrl = redirectCount > 0 || expectedUrl.href === url.href
            return isExpectedInitialUrl && expectedUrl.origin === url.origin
                ? Effect.void
                : Effect.fail(
                    new ProxyForbidden({
                        code: "redirect_not_allowed",
                        message: "Development URL targets may only redirect within the same origin",
                    }),
                )
        },
    }
}

export const A2AProxyPolicy = {
    fromTargets: configuredTargets,
    developmentUrls,
} as const
