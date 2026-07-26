import { afterEach, describe, expect, it } from "bun:test"
import { HttpApiBuilder, HttpServer } from "@effect/platform"
import { Effect, Fiber, Layer } from "effect"

import { InspectorApi } from "../api"
import { CoreHandlers } from "../handlers"
import { isBlockedIpAddress, type A2AProxyDnsResolver } from "./network"
import { A2AProxyPolicy, resolveAgentCardUrl } from "./policy"
import {
    A2AProxy,
    type A2AProxyFetchAdapter,
    A2AProxyModule,
    type A2AProxyModuleOptions,
} from "./proxy"

const cleanups: Array<() => void | Promise<void>> = []

afterEach(async () => {
    await Promise.all(cleanups.splice(0).reverse().map((cleanup) => cleanup()))
})

function startServer(fetch: (request: Request) => Response | Promise<Response>): Bun.Server<unknown> {
    const server = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        fetch,
    })
    cleanups.push(() => server.stop(true))
    return server
}

function makeHandler(options: A2AProxyModuleOptions) {
    const HandlersLive = CoreHandlers.pipe(Layer.provide(A2AProxyModule.layer(options)))
    const ApiLive = HttpApiBuilder.api(InspectorApi).pipe(Layer.provide(HandlersLive))
    const ApiLayer = Layer.mergeAll(ApiLive, HttpServer.layerContext)
    const webHandler = HttpApiBuilder.toWebHandler(ApiLayer)
    cleanups.push(webHandler.dispose)
    return webHandler.handler
}

function localTarget(server: Bun.Server<unknown>, input: {
    readonly agentCardPath?: string
    readonly jsonRpcPath?: string
    readonly headers?: Readonly<Record<string, string>>
    readonly allowedRedirectOrigins?: ReadonlyArray<string | URL>
} = {}) {
    return {
        baseUrl: new URL(input.jsonRpcPath ?? "/rpc", server.url),
        agentCardUrl: new URL(input.agentCardPath ?? "/agent-card", server.url),
        headers: input.headers,
        allowedRedirectOrigins: input.allowedRedirectOrigins,
    }
}

function agentCardRequest(handler: (request: Request) => Promise<Response>, targetId?: string) {
    const url = new URL("http://proxy.test/api/a2a/agent-card")
    if (targetId !== undefined) url.searchParams.set("targetId", targetId)
    return handler(new Request(url))
}

function jsonRpcRequest(
    handler: (request: Request) => Promise<Response>,
    targetId: string,
    init: RequestInit = {},
) {
    const url = new URL("http://proxy.test/api/a2a/jsonrpc")
    url.searchParams.set("targetId", targetId)
    return handler(new Request(url, {
        method: "POST",
        body: "{}",
        ...init,
    }))
}

async function expectProxyError(response: Response, status: number, code: string) {
    expect(response.status).toBe(status)
    expect(await response.json()).toMatchObject({
        _tag: expect.any(String),
        code,
        message: expect.any(String),
    })
}

const publicDns: A2AProxyDnsResolver = {
    lookup: async () => [{ address: "93.184.216.34", family: 4 }],
}

describe("target policies", () => {
    it("resolves an agent card relative to the configured A2A base path", () => {
        expect(resolveAgentCardUrl(new URL("https://agent.example/agents/one/a2a")).href).toBe(
            "https://agent.example/agents/one/a2a/.well-known/agent-card.json",
        )
    })

    it("uses server-owned IDs and denies missing, unknown, and raw URL targets", async () => {
        const fetchAdapter: A2AProxyFetchAdapter = {
            fetch: async () => new Response("{}", { headers: { "content-type": "application/json" } }),
        }
        const handler = makeHandler({
            targets: {
                production: { baseUrl: "https://agent.example/rpc" },
            },
            dnsResolver: publicDns,
            fetchAdapter,
        })

        await expectProxyError(await agentCardRequest(handler), 400, "invalid_target_id")
        await expectProxyError(await agentCardRequest(handler, "unknown"), 403, "target_not_allowed")
        await expectProxyError(
            await agentCardRequest(handler, "https://agent.example/rpc"),
            403,
            "target_not_allowed",
        )
        expect((await agentCardRequest(handler, "production")).status).toBe(200)
    })

    it("accepts caller URLs only with the explicit development policy", async () => {
        const server = startServer(() => new Response("agent-card"))
        const baseUrl = new URL("/rpc", server.url).href
        const handler = makeHandler({
            policy: A2AProxyPolicy.developmentUrls(),
            allowPrivateAddresses: true,
        })

        const response = await agentCardRequest(handler, baseUrl)
        expect(response.status).toBe(200)
        expect(await response.text()).toBe("agent-card")
    })

    it("rejects unsafe configured and development URLs", async () => {
        for (const baseUrl of [
            "file:///tmp/agent",
            "https://user:password@agent.example/rpc",
            "https://agent.example/rpc#fragment",
        ]) {
            expect(() => A2AProxyModule.layer({ targets: { bad: { baseUrl } } })).toThrow()
        }

        const handler = makeHandler({
            policy: A2AProxyPolicy.developmentUrls(),
            dnsResolver: publicDns,
            fetchAdapter: {
                fetch: async () => new Response("unreachable"),
            },
        })
        for (const target of [
            "file:///tmp/agent",
            "https://user:password@agent.example/rpc",
            "https://agent.example/rpc#fragment",
        ]) {
            await expectProxyError(await agentCardRequest(handler, target), 400, "invalid_development_url")
        }
    })
})

describe("network policy", () => {
    it("classifies private, loopback, link-local, translated, and non-routable addresses", () => {
        for (const address of [
            "0.0.0.0",
            "10.0.0.1",
            "100.64.0.1",
            "127.0.0.1",
            "169.254.169.254",
            "172.16.0.1",
            "192.168.0.1",
            "224.0.0.1",
            "::",
            "::1",
            "::ffff:127.0.0.1",
            "64:ff9b::7f00:1",
            "fc00::1",
            "fe80::1",
            "ff00::1",
            "3fff::1",
            "5f00::1",
        ]) {
            expect(isBlockedIpAddress(address), address).toBe(true)
        }
        expect(isBlockedIpAddress("93.184.216.34")).toBe(false)
        expect(isBlockedIpAddress("2606:4700:4700::1111")).toBe(false)
    })

    it("blocks direct loopback targets by default after resolution", async () => {
        const server = startServer(() => new Response("should not be reached"))
        const handler = makeHandler({ targets: { local: localTarget(server) } })
        await expectProxyError(
            await agentCardRequest(handler, "local"),
            403,
            "private_address_blocked",
        )
    })

    it("blocks a hostname if any DNS answer is private, for IPv4 and IPv6", async () => {
        let fetches = 0
        const handler = makeHandler({
            targets: { agent: { baseUrl: "https://agent.example/rpc" } },
            dnsResolver: {
                lookup: async () => [
                    { address: "93.184.216.34", family: 4 },
                    { address: "fe80::1", family: 6 },
                ],
            },
            fetchAdapter: {
                fetch: async () => {
                    fetches += 1
                    return new Response("unreachable")
                },
            },
        })

        await expectProxyError(
            await agentCardRequest(handler, "agent"),
            403,
            "private_address_blocked",
        )
        expect(fetches).toBe(0)
    })

    it("pins the default transport to the address returned by the validated resolver", async () => {
        const server = startServer(() => new Response("pinned"))
        const handler = makeHandler({
            targets: {
                agent: {
                    baseUrl: `http://does-not-resolve.invalid:${server.port}/rpc`,
                    agentCardUrl: `http://does-not-resolve.invalid:${server.port}/card`,
                },
            },
            dnsResolver: {
                lookup: async () => [{ address: "127.0.0.1", family: 4 }],
            },
            allowPrivateAddresses: true,
        })

        const response = await agentCardRequest(handler, "agent")
        expect(response.status).toBe(200)
        expect(await response.text()).toBe("pinned")
    })
})

describe("redirects", () => {
    it("follows same-origin redirects manually and enforces the maximum", async () => {
        const server = startServer((request) => {
            const path = new URL(request.url).pathname
            if (path === "/one") return Response.redirect(new URL("/two", request.url), 302)
            if (path === "/two") return Response.redirect(new URL("/final", request.url), 307)
            return new Response("final")
        })

        const allowed = makeHandler({
            targets: { agent: localTarget(server, { agentCardPath: "/one" }) },
            allowPrivateAddresses: true,
            limits: { maxRedirects: 2 },
        })
        expect(await (await agentCardRequest(allowed, "agent")).text()).toBe("final")

        const limited = makeHandler({
            targets: { agent: localTarget(server, { agentCardPath: "/one" }) },
            allowPrivateAddresses: true,
            limits: { maxRedirects: 1 },
        })
        await expectProxyError(await agentCardRequest(limited, "agent"), 502, "too_many_redirects")
    })

    it("rejects cross-origin redirects unless the target explicitly allows the origin", async () => {
        const destination = startServer(() => new Response("destination"))
        const source = startServer(() => Response.redirect(new URL("/final", destination.url), 302))
        const handler = makeHandler({
            targets: { agent: localTarget(source) },
            allowPrivateAddresses: true,
        })

        await expectProxyError(
            await agentCardRequest(handler, "agent"),
            403,
            "redirect_not_allowed",
        )
    })

    it("DNS-checks every allowed redirect before issuing the next request", async () => {
        let fetches = 0
        const handler = makeHandler({
            targets: {
                agent: {
                    baseUrl: "https://public.example/rpc",
                    agentCardUrl: "https://public.example/card",
                    allowedRedirectOrigins: ["https://private.example"],
                },
            },
            dnsResolver: {
                lookup: async (hostname) => hostname === "public.example"
                    ? [{ address: "93.184.216.34", family: 4 }]
                    : [{ address: "10.0.0.1", family: 4 }],
            },
            fetchAdapter: {
                fetch: async () => {
                    fetches += 1
                    return Response.redirect("https://private.example/card", 302)
                },
            },
        })

        await expectProxyError(
            await agentCardRequest(handler, "agent"),
            403,
            "private_address_blocked",
        )
        expect(fetches).toBe(1)
    })

    it("rejects redirect URLs with credentials, fragments, or non-HTTP schemes", async () => {
        for (const [location, code] of [
            ["https://user:secret@agent.example/card", "unsafe_target_url"],
            ["https://agent.example/card#fragment", "unsafe_target_url"],
            ["file:///tmp/agent-card.json", "redirect_not_allowed"],
        ] as const) {
            const handler = makeHandler({
                targets: {
                    agent: {
                        baseUrl: "https://agent.example/rpc",
                        agentCardUrl: "https://agent.example/card",
                    },
                },
                dnsResolver: publicDns,
                fetchAdapter: {
                    fetch: async () => new Response(null, {
                        status: 302,
                        headers: { location },
                    }),
                },
            })

            await expectProxyError(await agentCardRequest(handler, "agent"), 403, code)
        }
    })

    it("does not leak injected credentials across an allowed origin change", async () => {
        const received = {
            sourceAuthorization: null as string | null,
            destinationAuthorization: null as string | null,
        }
        const destination = startServer((request) => {
            received.destinationAuthorization = request.headers.get("authorization")
            return new Response("destination")
        })
        const source = startServer((request) => {
            received.sourceAuthorization = request.headers.get("authorization")
            return Response.redirect(new URL("/final", destination.url), 307)
        })
        const handler = makeHandler({
            targets: {
                agent: localTarget(source, {
                    headers: { authorization: "Bearer server-secret" },
                    allowedRedirectOrigins: [destination.url],
                }),
            },
            allowPrivateAddresses: true,
        })

        expect((await agentCardRequest(handler, "agent")).status).toBe(200)
        expect(received.sourceAuthorization).toBe("Bearer server-secret")
        expect(received.destinationAuthorization).toBeNull()
    })
})

describe("headers", () => {
    it("uses explicit request/response allowlists, injects server credentials, and strips cookies", async () => {
        let receivedHeaders: Headers | undefined
        const server = startServer((request) => {
            receivedHeaders = new Headers(request.headers)
            return new Response("ok", {
                headers: [
                    ["content-type", "application/json"],
                    ["cache-control", "no-cache"],
                    ["set-cookie", "session=upstream; HttpOnly"],
                    ["connection", "x-hop"],
                    ["x-hop", "remove-me"],
                    ["x-upstream", "allowed"],
                ],
            })
        })
        const handler = makeHandler({
            targets: {
                agent: localTarget(server, {
                    headers: {
                        authorization: "Bearer server-secret",
                        cookie: "server-cookie=value",
                        "x-api-key": "server-key",
                    },
                }),
            },
            allowPrivateAddresses: true,
            headers: {
                response: ["content-type", "cache-control", "x-hop", "x-upstream"],
            },
        })

        const response = await jsonRpcRequest(handler, "agent", {
            headers: {
                accept: "text/event-stream",
                authorization: "Bearer browser-secret",
                cookie: "browser-cookie=value",
                "content-type": "application/json",
                "x-browser-only": "remove-me",
            },
        })

        expect(receivedHeaders?.get("accept")).toBe("text/event-stream")
        expect(receivedHeaders?.get("content-type")).toBe("application/json")
        expect(receivedHeaders?.get("authorization")).toBe("Bearer server-secret")
        expect(receivedHeaders?.get("cookie")).toBe("server-cookie=value")
        expect(receivedHeaders?.get("x-api-key")).toBe("server-key")
        expect(receivedHeaders?.get("x-browser-only")).toBeNull()
        expect(response.headers.get("content-type")).toBe("application/json")
        expect(response.headers.get("cache-control")).toBe("no-cache")
        expect(response.headers.get("x-upstream")).toBe("allowed")
        expect(response.headers.get("set-cookie")).toBeNull()
        expect(response.headers.get("x-hop")).toBeNull()
    })

    it("does not permit sensitive or hop-by-hop headers in configurable client allowlists", () => {
        for (const name of ["authorization", "cookie", "connection", "set-cookie"] as const) {
            expect(() => A2AProxyModule.layer({
                targets: {},
                headers: { request: [name] },
            })).toThrow()
        }
        for (const name of ["authorization", "cookie", "set-cookie"] as const) {
            expect(() => A2AProxyModule.layer({
                targets: {},
                headers: { response: [name] },
            })).toThrow()
        }
    })
})

describe("limits, interruption, and streaming", () => {
    it("returns 413 for a chunked request that exceeds the byte limit", async () => {
        const server = startServer(() => new Response("unreachable"))
        const handler = makeHandler({
            targets: { agent: localTarget(server) },
            allowPrivateAddresses: true,
            limits: { maxRequestBytes: 4 },
        })
        const url = new URL("http://proxy.test/api/a2a/jsonrpc?targetId=agent")
        const body = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode("123"))
                controller.enqueue(new TextEncoder().encode("456"))
                controller.close()
            },
        })
        const request = new Request(url, {
            method: "POST",
            body,
            duplex: "half",
        } as RequestInit & { duplex: "half" })

        await expectProxyError(await handler(request), 413, "request_too_large")
    })

    it("returns 502 when an agent card or buffered response exceeds its limit", async () => {
        const server = startServer(() => new Response("123456"))
        const handler = makeHandler({
            targets: { agent: localTarget(server) },
            allowPrivateAddresses: true,
            limits: { maxAgentCardBytes: 5, maxResponseBytes: 5 },
        })

        await expectProxyError(
            await agentCardRequest(handler, "agent"),
            502,
            "upstream_response_too_large",
        )
        await expectProxyError(
            await jsonRpcRequest(handler, "agent"),
            502,
            "upstream_response_too_large",
        )
    })

    it("returns 504 and aborts the fetch when the upstream timeout expires", async () => {
        let fetchSignal: AbortSignal | undefined
        const fetchAdapter: A2AProxyFetchAdapter = {
            fetch: ({ init }) => {
                fetchSignal = init.signal as AbortSignal
                return new Promise<Response>((_resolve, reject) => {
                    fetchSignal!.addEventListener("abort", () => reject(fetchSignal!.reason), { once: true })
                })
            },
        }
        const handler = makeHandler({
            targets: { agent: { baseUrl: "https://agent.example/rpc" } },
            dnsResolver: publicDns,
            fetchAdapter,
            limits: { requestTimeoutMs: 20 },
        })

        await expectProxyError(await agentCardRequest(handler, "agent"), 504, "upstream_timeout")
        expect(fetchSignal?.aborted).toBe(true)
    })

    it("propagates Effect interruption to the adapter AbortSignal", async () => {
        let started!: () => void
        const fetchStarted = new Promise<void>((resolve) => {
            started = resolve
        })
        let fetchSignal: AbortSignal | undefined
        const layer = A2AProxyModule.layer({
            targets: { agent: { baseUrl: "https://agent.example/rpc" } },
            dnsResolver: publicDns,
            fetchAdapter: {
                fetch: ({ init }) => {
                    fetchSignal = init.signal as AbortSignal
                    started()
                    return new Promise<Response>((_resolve, reject) => {
                        fetchSignal!.addEventListener("abort", () => reject(fetchSignal!.reason), { once: true })
                    })
                },
            },
        })
        const effect = Effect.flatMap(A2AProxy, (proxy) =>
            proxy.agentCard({ targetId: "agent", headers: {} })
        ).pipe(Effect.provide(layer))
        const fiber = Effect.runFork(effect)

        await fetchStarted
        await Effect.runPromise(Fiber.interrupt(fiber))
        expect(fetchSignal?.aborted).toBe(true)
    })

    it("streams SSE incrementally, strips cookies, and preserves the content type", async () => {
        let secondSent = false
        const encoder = new TextEncoder()
        const server = startServer(() => new Response(
            new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(encoder.encode("data: first\n\n"))
                    setTimeout(() => {
                        secondSent = true
                        controller.enqueue(encoder.encode("data: second\n\n"))
                        controller.close()
                    }, 50)
                },
            }),
            {
                headers: [
                    ["content-type", "text/event-stream"],
                    ["cache-control", "no-cache"],
                    ["set-cookie", "stream=secret"],
                ],
            },
        ))
        const handler = makeHandler({
            targets: { agent: localTarget(server) },
            allowPrivateAddresses: true,
        })

        const response = await jsonRpcRequest(handler, "agent", {
            headers: { accept: "text/event-stream", "content-type": "application/json" },
        })
        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toStartWith("text/event-stream")
        expect(response.headers.get("set-cookie")).toBeNull()

        const reader = response.body!.getReader()
        const first = await reader.read()
        expect(new TextDecoder().decode(first.value)).toContain("data: first")
        expect(secondSent).toBe(false)
        const second = await reader.read()
        expect(new TextDecoder().decode(second.value)).toContain("data: second")
        await reader.cancel()
    })

    it("fails an SSE body once the streaming byte limit is crossed", async () => {
        const handler = makeHandler({
            targets: { agent: { baseUrl: "https://agent.example/rpc" } },
            dnsResolver: publicDns,
            fetchAdapter: {
                fetch: async () => new Response(
                    new ReadableStream<Uint8Array>({
                        start(controller) {
                            controller.enqueue(new TextEncoder().encode("data: too-large\n\n"))
                            controller.close()
                        },
                    }),
                    { headers: { "content-type": "text/event-stream" } },
                ),
            },
            limits: { maxStreamingResponseBytes: 4 },
        })

        const response = await jsonRpcRequest(handler, "agent")
        expect(response.status).toBe(200)
        await expect(response.text()).rejects.toThrow()
    })
})
