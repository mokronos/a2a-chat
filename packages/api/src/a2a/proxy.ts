import { request as httpRequest } from "node:http"
import { request as httpsRequest } from "node:https"
import { Readable } from "node:stream"

import { HttpServerResponse } from "@effect/platform"
import { Context, Effect, Layer, Stream } from "effect"

import {
    type A2AProxyError,
    ProxyBadGateway,
    ProxyBadRequest,
    ProxyGatewayTimeout,
    ProxyPayloadTooLarge,
} from "./errors"
import {
    type A2AProxyDnsResolver,
    defaultDnsResolver,
    type ResolvedAddress,
    validateNetworkUrl,
} from "./network"
import {
    type A2AProxyOperation,
    type A2AProxyPolicy,
    A2AProxyPolicy as Policy,
    type A2ATargetDefinition,
    type ResolvedA2ATarget,
} from "./policy"

export interface A2AProxyLimits {
    readonly maxRedirects: number
    readonly requestTimeoutMs: number
    readonly maxRequestBytes: number
    readonly maxAgentCardBytes: number
    readonly maxResponseBytes: number
    readonly maxStreamingResponseBytes: number
    readonly streamIdleTimeoutMs: number
}

export interface A2AProxyHeaderPolicy {
    readonly request: ReadonlyArray<string>
    readonly response: ReadonlyArray<string>
}

export interface A2AProxyFetchRequest {
    readonly url: URL
    readonly init: RequestInit
    readonly resolvedAddresses: ReadonlyArray<ResolvedAddress>
    readonly targetId: string
    readonly operation: A2AProxyOperation
    readonly redirectCount: number
}

export interface A2AProxyFetchAdapter {
    readonly fetch: (request: A2AProxyFetchRequest) => PromiseLike<Response>
}

interface ModuleCommonOptions {
    readonly limits?: Partial<A2AProxyLimits>
    readonly headers?: Partial<A2AProxyHeaderPolicy>
    readonly dnsResolver?: A2AProxyDnsResolver
    readonly fetchAdapter?: A2AProxyFetchAdapter
    readonly allowPrivateAddresses?: boolean
}

export type A2AProxyModuleOptions = ModuleCommonOptions & (
    | {
        readonly targets: Readonly<Record<string, A2ATargetDefinition>>
        readonly policy?: never
    }
    | {
        readonly policy: A2AProxyPolicy
        readonly targets?: never
    }
)

export interface A2AProxyRequest {
    readonly targetId: string | undefined
    readonly headers: Readonly<Record<string, string>>
    readonly signal?: AbortSignal
}

export interface A2AProxyJsonRpcRequest extends A2AProxyRequest {
    readonly body: Stream.Stream<Uint8Array, unknown>
}

export interface A2AProxyService {
    readonly agentCard: (
        input: A2AProxyRequest,
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, A2AProxyError>
    readonly jsonRpc: (
        input: A2AProxyJsonRpcRequest,
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, A2AProxyError>
}

export class A2AProxy extends Context.Tag("@mokronos/a2a-chat-api/A2AProxy")<
    A2AProxy,
    A2AProxyService
>() {}

export const defaultA2AProxyLimits: A2AProxyLimits = Object.freeze({
    maxRedirects: 3,
    requestTimeoutMs: 10_000,
    maxRequestBytes: 1_048_576,
    maxAgentCardBytes: 262_144,
    maxResponseBytes: 8_388_608,
    maxStreamingResponseBytes: 67_108_864,
    streamIdleTimeoutMs: 60_000,
})

export const defaultA2AProxyHeaderPolicy: A2AProxyHeaderPolicy = Object.freeze({
    request: Object.freeze(["accept", "content-type"]),
    response: Object.freeze([
        "cache-control",
        "content-language",
        "content-type",
        "etag",
        "last-modified",
        "retry-after",
        "x-accel-buffering",
    ]),
})

const hardBlockedHeaders = new Set([
    "connection",
    "content-length",
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

const hardBlockedClientRequestHeaders = new Set([
    ...hardBlockedHeaders,
    "authorization",
    "cookie",
    "host",
    "proxy-authorization",
])

const hardBlockedResponseHeaders = new Set([
    ...hardBlockedHeaders,
    "authorization",
    "cookie",
])

const redirectStatuses = new Set([301, 302, 303, 307, 308])

const defaultFetchAdapter: A2AProxyFetchAdapter = {
    fetch: ({ url, init, resolvedAddresses }) => new Promise((resolve, reject) => {
        const address = resolvedAddresses[0]
        if (!address) {
            reject(new Error("Cannot issue a request without a validated address"))
            return
        }

        const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
            url,
            {
                method: init.method,
                headers: Object.fromEntries(new Headers(init.headers)),
                signal: init.signal ?? undefined,
                lookup: (_hostname, _options, callback) => {
                    if ((_options as { readonly all?: boolean }).all) {
                        ;(callback as unknown as (
                            error: null,
                            addresses: ReadonlyArray<ResolvedAddress>,
                        ) => void)(null, resolvedAddresses.map((resolved) => ({ ...resolved })))
                    } else {
                        callback(null, address.address, address.family)
                    }
                },
            },
            (upstream) => {
                const headers = new Headers()
                for (let index = 0; index < upstream.rawHeaders.length; index += 2) {
                    headers.append(upstream.rawHeaders[index]!, upstream.rawHeaders[index + 1]!)
                }

                const status = upstream.statusCode ?? 502
                const hasBody = status !== 204 && status !== 304
                if (!hasBody) upstream.resume()
                resolve(new Response(
                    hasBody
                        ? Readable.toWeb(upstream) as unknown as ReadableStream<Uint8Array>
                        : null,
                    {
                        status,
                        statusText: upstream.statusMessage,
                        headers,
                    },
                ))
            },
        )
        request.on("error", reject)

        if (init.body instanceof ArrayBuffer) {
            request.end(new Uint8Array(init.body))
        } else if (init.body === undefined || init.body === null) {
            request.end()
        } else {
            request.destroy(new TypeError("The pinned fetch adapter only accepts buffered request bodies"))
        }
    }),
}

class ResponseLimitExceeded extends Error {}

class ByteAccumulator {
    readonly #limit: number
    #bytes: Uint8Array
    #size = 0

    constructor(limit: number) {
        this.#limit = limit
        this.#bytes = new Uint8Array(Math.min(limit, 65_536))
    }

    append(chunk: Uint8Array): boolean {
        const size = this.#size + chunk.byteLength
        if (size > this.#limit) return false
        if (size > this.#bytes.byteLength) {
            const capacity = Math.min(
                this.#limit,
                Math.max(size, this.#bytes.byteLength * 2),
            )
            const expanded = new Uint8Array(capacity)
            expanded.set(this.#bytes)
            this.#bytes = expanded
        }
        this.#bytes.set(chunk, this.#size)
        this.#size = size
        return true
    }

    toUint8Array(): Uint8Array {
        return this.#bytes.slice(0, this.#size)
    }
}

function requirePositiveInteger(name: string, value: number, allowZero = false): number {
    if (!Number.isSafeInteger(value) || (allowZero ? value < 0 : value <= 0)) {
        throw new TypeError(`${name} must be ${allowZero ? "a non-negative" : "a positive"} integer`)
    }
    return value
}

function makeLimits(input: Partial<A2AProxyLimits> | undefined): A2AProxyLimits {
    const limits = { ...defaultA2AProxyLimits, ...input }
    return Object.freeze({
        maxRedirects: requirePositiveInteger("maxRedirects", limits.maxRedirects, true),
        requestTimeoutMs: requirePositiveInteger("requestTimeoutMs", limits.requestTimeoutMs),
        maxRequestBytes: requirePositiveInteger("maxRequestBytes", limits.maxRequestBytes),
        maxAgentCardBytes: requirePositiveInteger("maxAgentCardBytes", limits.maxAgentCardBytes),
        maxResponseBytes: requirePositiveInteger("maxResponseBytes", limits.maxResponseBytes),
        maxStreamingResponseBytes: requirePositiveInteger(
            "maxStreamingResponseBytes",
            limits.maxStreamingResponseBytes,
        ),
        streamIdleTimeoutMs: requirePositiveInteger("streamIdleTimeoutMs", limits.streamIdleTimeoutMs),
    })
}

function makeHeaderAllowlist(
    input: ReadonlyArray<string> | undefined,
    fallback: ReadonlyArray<string>,
    hardBlocked: ReadonlySet<string>,
): ReadonlySet<string> {
    const headers = new Set<string>()
    for (const rawName of input ?? fallback) {
        const name = rawName.toLowerCase()
        try {
            new Headers([[name, "value"]])
        } catch {
            throw new TypeError(`Invalid header name '${rawName}' in the proxy allowlist`)
        }
        if (hardBlocked.has(name)) {
            throw new TypeError(`Header '${rawName}' cannot be added to the proxy allowlist`)
        }
        headers.add(name)
    }
    return headers
}

function targetIdOrError(targetId: string | undefined): Effect.Effect<string, ProxyBadRequest> {
    if (!targetId || targetId.length > 2_048 || targetId.trim() !== targetId) {
        return Effect.fail(
            new ProxyBadRequest({
                code: "invalid_target_id",
                message: "targetId must be 1-2048 characters without surrounding whitespace",
            }),
        )
    }
    return Effect.succeed(targetId)
}

function parseContentLength(value: string | undefined): number | undefined {
    if (value === undefined || !/^\d+$/.test(value)) return undefined
    const length = Number(value)
    return Number.isSafeInteger(length) ? length : undefined
}

function readRequestBody(
    input: A2AProxyJsonRpcRequest,
    limit: number,
): Effect.Effect<Uint8Array, ProxyBadRequest | ProxyPayloadTooLarge> {
    const declaredLength = parseContentLength(input.headers["content-length"])
    if (declaredLength !== undefined && declaredLength > limit) {
        return Effect.fail(
            new ProxyPayloadTooLarge({
                code: "request_too_large",
                message: `Request body exceeds the ${limit} byte limit`,
            }),
        )
    }

    return Stream.runFoldEffect(
        input.body,
        new ByteAccumulator(limit),
        (body, chunk) =>
            !body.append(chunk)
                ? Effect.fail(
                    new ProxyPayloadTooLarge({
                        code: "request_too_large",
                        message: `Request body exceeds the ${limit} byte limit`,
                    }),
                )
                : Effect.succeed(body),
    ).pipe(
        Effect.map((body) => body.toUint8Array()),
        Effect.mapError((cause) =>
            cause instanceof ProxyPayloadTooLarge
                ? cause
                : new ProxyBadRequest({
                    code: "request_body_failed",
                    message: "Could not read the request body",
                })
        ),
    )
}

function safeRequestHeaders(input: {
    readonly incoming: Readonly<Record<string, string>>
    readonly injected: Readonly<Record<string, string>>
    readonly allowlist: ReadonlySet<string>
    readonly includeInjected: boolean
    readonly hasBody: boolean
}): Headers {
    const headers = new Headers()
    for (const [rawName, value] of Object.entries(input.incoming)) {
        const name = rawName.toLowerCase()
        if (input.allowlist.has(name) && !hardBlockedClientRequestHeaders.has(name)) {
            headers.set(name, value)
        }
    }

    if (input.includeInjected) {
        for (const [rawName, value] of Object.entries(input.injected)) {
            const name = rawName.toLowerCase()
            if (!hardBlockedHeaders.has(name) && name !== "host") headers.set(name, value)
        }
    }

    if (!input.hasBody) headers.delete("content-type")
    return headers
}

function safeResponseHeaders(response: Response, allowlist: ReadonlySet<string>): Record<string, string> {
    const connectionHeaders = new Set(
        (response.headers.get("connection") ?? "")
            .split(",")
            .map((header) => header.trim().toLowerCase())
            .filter(Boolean),
    )
    const headers: Record<string, string> = {}
    for (const [rawName, value] of response.headers) {
        const name = rawName.toLowerCase()
        if (
            allowlist.has(name)
            && !hardBlockedResponseHeaders.has(name)
            && !connectionHeaders.has(name)
        ) {
            headers[name] = value
        }
    }
    return headers
}

function isEventStream(response: Response): boolean {
    return response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
        === "text/event-stream"
}

function responseLengthExceeds(response: Response, limit: number): boolean {
    const length = response.headers.get("content-length")
    return length !== null && /^\d+$/.test(length) && Number(length) > limit
}

function readResponseBody(
    response: Response,
    controller: AbortController,
    limit: number,
): Effect.Effect<Uint8Array, ProxyBadGateway> {
    if (responseLengthExceeds(response, limit)) {
        controller.abort()
        return Effect.fail(
            new ProxyBadGateway({
                code: "upstream_response_too_large",
                message: `Upstream response exceeds the ${limit} byte limit`,
            }),
        )
    }
    if (!response.body) return Effect.succeed(new Uint8Array())

    return Effect.tryPromise({
        try: async (signal) => {
            const abort = () => controller.abort()
            signal.addEventListener("abort", abort, { once: true })
            const reader = response.body!.getReader()
            const body = new ByteAccumulator(limit)
            try {
                while (true) {
                    const result = await reader.read()
                    if (result.done) break
                    if (!body.append(result.value)) throw new ResponseLimitExceeded()
                }
                return body.toUint8Array()
            } finally {
                signal.removeEventListener("abort", abort)
                reader.releaseLock()
            }
        },
        catch: (cause) =>
            new ProxyBadGateway({
                code: cause instanceof ResponseLimitExceeded
                    ? "upstream_response_too_large"
                    : "upstream_response_failed",
                message: cause instanceof ResponseLimitExceeded
                    ? `Upstream response exceeds the ${limit} byte limit`
                    : "Could not read the upstream response",
            }),
    }).pipe(Effect.ensuring(Effect.sync(() => controller.abort())))
}

function bufferedResponse(
    response: Response,
    body: Uint8Array,
    responseHeaders: ReadonlySet<string>,
): HttpServerResponse.HttpServerResponse {
    const headers = safeResponseHeaders(response, responseHeaders)
    if (response.status === 204 || response.status === 304) {
        return HttpServerResponse.empty({ status: response.status, headers })
    }
    return HttpServerResponse.uint8Array(body, { status: response.status, headers })
}

function streamingResponse(
    response: Response,
    controller: AbortController,
    limit: number,
    idleTimeoutMs: number,
    responseHeaders: ReadonlySet<string>,
): Effect.Effect<HttpServerResponse.HttpServerResponse, ProxyBadGateway> {
    if (responseLengthExceeds(response, limit)) {
        controller.abort()
        return Effect.fail(
            new ProxyBadGateway({
                code: "upstream_response_too_large",
                message: `Upstream stream exceeds the ${limit} byte limit`,
            }),
        )
    }
    if (!response.body) {
        controller.abort()
        return Effect.succeed(
            HttpServerResponse.empty({
                status: response.status,
                headers: safeResponseHeaders(response, responseHeaders),
            }),
        )
    }

    let size = 0
    const stream = Stream.fromReadableStream({
        evaluate: () => response.body!,
        onError: (cause) => cause,
    }).pipe(
        Stream.mapEffect((chunk) => {
            size += chunk.byteLength
            return size > limit
                ? Effect.fail(new ProxyBadGateway({
                    code: "upstream_response_too_large",
                    message: `Upstream stream exceeds the ${limit} byte limit`,
                }))
                : Effect.succeed(chunk)
        }),
        Stream.timeoutFail(
            () => new ProxyBadGateway({
                code: "upstream_stream_idle_timeout",
                message: `Upstream stream was idle for more than ${idleTimeoutMs}ms`,
            }),
            idleTimeoutMs,
        ),
        Stream.ensuring(Effect.sync(() => controller.abort())),
    )
    const headers = safeResponseHeaders(response, responseHeaders)
    const contentType = headers["content-type"]
    return Effect.succeed(
        HttpServerResponse.stream(stream, {
            status: response.status,
            headers,
            contentType,
        }),
    )
}

function makeService(options: A2AProxyModuleOptions): A2AProxyService {
    const limits = makeLimits(options.limits)
    const requestHeaders = makeHeaderAllowlist(
        options.headers?.request,
        defaultA2AProxyHeaderPolicy.request,
        hardBlockedClientRequestHeaders,
    )
    const responseHeaders = makeHeaderAllowlist(
        options.headers?.response,
        defaultA2AProxyHeaderPolicy.response,
        hardBlockedResponseHeaders,
    )
    const policy = options.policy ?? Policy.fromTargets(options.targets)
    const resolver = options.dnsResolver ?? defaultDnsResolver
    const fetchAdapter = options.fetchAdapter ?? defaultFetchAdapter
    const allowPrivateAddresses = options.allowPrivateAddresses === true

    const resolveTarget = (targetId: string | undefined) =>
        targetIdOrError(targetId).pipe(Effect.flatMap((id) => policy.resolve(id)))

    const fetchWithRedirects = (input: {
        readonly target: ResolvedA2ATarget
        readonly operation: A2AProxyOperation
        readonly incomingHeaders: Readonly<Record<string, string>>
        readonly clientSignal?: AbortSignal
        readonly initialUrl: URL
        readonly initialMethod: "GET" | "POST"
        readonly initialBody?: Uint8Array
    }): Effect.Effect<
        { readonly response: Response; readonly controller: AbortController },
        A2AProxyError
    > => {
        const follow = (
            url: URL,
            method: "GET" | "POST",
            body: Uint8Array | undefined,
            redirectCount: number,
        ): Effect.Effect<
            { readonly response: Response; readonly controller: AbortController },
            A2AProxyError
        > => Effect.gen(function* () {
            yield* policy.authorize({
                target: input.target,
                operation: input.operation,
                url,
                redirectCount,
            })
            const resolvedAddresses = yield* validateNetworkUrl({
                url,
                resolver,
                allowPrivateAddresses,
                signal: input.clientSignal,
            })
            const controller = new AbortController()
            const response = yield* Effect.tryPromise({
                try: (effectSignal) => {
                    const signals = input.clientSignal
                        ? [effectSignal, input.clientSignal, controller.signal]
                        : [effectSignal, controller.signal]
                    return fetchAdapter.fetch({
                        url,
                        init: {
                            method,
                            headers: safeRequestHeaders({
                                incoming: input.incomingHeaders,
                                injected: input.target.headers,
                                allowlist: requestHeaders,
                                includeInjected: url.origin === input.initialUrl.origin,
                                hasBody: body !== undefined,
                            }),
                            body: body?.buffer as ArrayBuffer | undefined,
                            redirect: "manual",
                            signal: AbortSignal.any(signals),
                        },
                        resolvedAddresses,
                        targetId: input.target.id,
                        operation: input.operation,
                        redirectCount,
                    })
                },
                catch: () =>
                    new ProxyBadGateway({
                        code: "upstream_request_failed",
                        message: "Could not reach the target endpoint",
                    }),
            })

            if (!redirectStatuses.has(response.status)) return { response, controller }

            const location = response.headers.get("location")
            if (!location) {
                controller.abort()
                return yield* new ProxyBadGateway({
                    code: "invalid_upstream_redirect",
                    message: "The upstream returned a redirect without a Location header",
                })
            }
            if (redirectCount >= limits.maxRedirects) {
                controller.abort()
                return yield* new ProxyBadGateway({
                    code: "too_many_redirects",
                    message: `The upstream exceeded the ${limits.maxRedirects} redirect limit`,
                })
            }

            const redirectUrl = yield* Effect.try({
                try: () => new URL(location, url),
                catch: () =>
                    new ProxyBadGateway({
                        code: "invalid_upstream_redirect",
                        message: "The upstream returned an invalid redirect URL",
                    }),
            }).pipe(Effect.tapError(() => Effect.sync(() => controller.abort())))

            controller.abort()
            const becomesGet = response.status === 303
                || ((response.status === 301 || response.status === 302) && method === "POST")
            return yield* follow(
                redirectUrl,
                becomesGet ? "GET" : method,
                becomesGet ? undefined : body,
                redirectCount + 1,
            )
        })

        return follow(input.initialUrl, input.initialMethod, input.initialBody, 0)
    }

    const withUpstreamTimeout = <A, E>(effect: Effect.Effect<A, E>) =>
        effect.pipe(
            Effect.timeoutFail({
                duration: limits.requestTimeoutMs,
                onTimeout: () =>
                    new ProxyGatewayTimeout({
                        code: "upstream_timeout",
                        message: `The upstream did not respond within ${limits.requestTimeoutMs}ms`,
                    }),
            }),
        )

    return {
        agentCard: (input) =>
            resolveTarget(input.targetId).pipe(
                Effect.flatMap((target) =>
                    Effect.gen(function* () {
                        const { response, controller } = yield* fetchWithRedirects({
                            target,
                            operation: "agentCard",
                            incomingHeaders: input.headers,
                            clientSignal: input.signal,
                            initialUrl: target.agentCardUrl,
                            initialMethod: "GET",
                        })
                        const body = yield* readResponseBody(
                            response,
                            controller,
                            limits.maxAgentCardBytes,
                        )
                        return bufferedResponse(response, body, responseHeaders)
                    }),
                ),
                withUpstreamTimeout,
            ),
        jsonRpc: (input) =>
            readRequestBody(input, limits.maxRequestBytes).pipe(
                Effect.flatMap((body) => resolveTarget(input.targetId).pipe(
                    Effect.flatMap((target) =>
                        Effect.gen(function* () {
                            const { response, controller } = yield* fetchWithRedirects({
                                target,
                                operation: "jsonrpc",
                                incomingHeaders: input.headers,
                                clientSignal: input.signal,
                                initialUrl: target.jsonRpcUrl,
                                initialMethod: "POST",
                                initialBody: body,
                            })
                            if (isEventStream(response)) {
                                return yield* streamingResponse(
                                    response,
                                    controller,
                                    limits.maxStreamingResponseBytes,
                                    limits.streamIdleTimeoutMs,
                                    responseHeaders,
                                )
                            }
                            const responseBody = yield* readResponseBody(
                                response,
                                controller,
                                limits.maxResponseBytes,
                            )
                            return bufferedResponse(response, responseBody, responseHeaders)
                        }),
                    ),
                    withUpstreamTimeout,
                )),
            ),
    }
}

export const A2AProxyModule = {
    layer: (options: A2AProxyModuleOptions): Layer.Layer<A2AProxy> =>
        Layer.succeed(A2AProxy, makeService(options)),
} as const
