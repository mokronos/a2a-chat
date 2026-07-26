import { afterEach, describe, expect, it } from "bun:test"
import type { AgentCard } from "@a2a-js/sdk"
import type { AuthenticationHandler } from "@a2a-js/sdk/client"
import { connectTarget, requiredExtensions } from "./runtime"
import { A2AChatError } from "./types"
import { agentCard, message, testClient } from "./test-helpers"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  return input instanceof URL ? input.toString() : input.url
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  return input instanceof Request ? input.method : (init?.method ?? "GET")
}

function responseForMessage() {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: 1, result: message("transport response") }),
    { status: 200, headers: { "content-type": "application/json" } },
  )
}

describe("connectTarget", () => {
  it("uses authentication with global fetch when no custom fetch is supplied", async () => {
    const seenAuthorization: Array<string | null> = []
    const card = agentCard()
    globalThis.fetch = (async (input, init) => {
      const headers = input instanceof Request ? input.headers : new Headers(init?.headers)
      seenAuthorization.push(headers.get("authorization"))
      return new Response(JSON.stringify(card), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }) as typeof fetch
    const authentication: AuthenticationHandler = {
      headers: async () => ({ Authorization: "Bearer test-token" }),
      shouldRetryWithHeaders: async () => undefined,
    }

    await connectTarget({ kind: "proxy", targetId: "secure" }, { authentication })

    expect(seenAuthorization).toEqual(["Bearer test-token"])
  })

  it("checks required extensions for injected clients", async () => {
    const card = agentCard({
      capabilities: { extensions: [{ uri: "urn:required", required: true }] },
    })
    const client = testClient({}, card)

    const rejected = connectTarget({ kind: "client", client, card })
    await expect(rejected).rejects.toBeInstanceOf(A2AChatError)
    await expect(rejected).rejects.toMatchObject({ code: "unsupported-required-extension" })
    await expect(
      connectTarget(
        { kind: "client", client, card },
        { supportedExtensionUris: ["urn:required"] },
      ),
    ).resolves.toEqual({ client, card })
  })

  it("reports all unsupported required extensions", () => {
    const card = agentCard({
      capabilities: {
        extensions: [
          { uri: "urn:one", required: true },
          { uri: "urn:optional", required: false },
          { uri: "urn:two", required: true },
        ],
      },
    })
    expect(requiredExtensions(card, ["urn:two"])).toEqual(["urn:one"])
  })

  it("builds root proxy endpoints without a double slash", async () => {
    const urls: string[] = []
    const card = agentCard()
    await connectTarget(
      { kind: "proxy", targetId: "root", basePath: "/" },
      {
        fetch: (async (input) => {
          urls.push(requestUrl(input))
          return new Response(JSON.stringify(card), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        }) as typeof fetch,
      },
    )
    expect(urls).toEqual(["/agent-card?targetId=root"])
  })

  it("uses targetId proxy endpoints for card and JSON-RPC transport", async () => {
    const urls: string[] = []
    const bodies: unknown[] = []
    const card = agentCard()
    const fetchImpl = (async (input, init) => {
      urls.push(requestUrl(input))
      if (requestMethod(input, init) === "GET") {
        return new Response(JSON.stringify(card), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      const body = input instanceof Request ? await input.clone().text() : String(init?.body)
      bodies.push(JSON.parse(body))
      return responseForMessage()
    }) as typeof fetch

    const connected = await connectTarget(
      { kind: "proxy", targetId: "agent 1", basePath: "/proxy/" },
      { fetch: fetchImpl },
    )
    await connected.client.sendMessage({
      message: message("request", { role: "user" }),
    })

    expect(urls).toEqual([
      "/proxy/agent-card?targetId=agent+1",
      "/proxy/jsonrpc?targetId=agent+1",
    ])
    expect(bodies[0]).toMatchObject({ method: "message/send" })
  })

  it("resolves a direct card and honors its JSON-RPC endpoint", async () => {
    const urls: string[] = []
    const card = agentCard({ url: "https://agent.test/custom-rpc" })
    const fetchImpl = (async (input, init) => {
      urls.push(requestUrl(input))
      if (requestMethod(input, init) === "GET") {
        return new Response(JSON.stringify(card), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      return responseForMessage()
    }) as typeof fetch

    const connected = await connectTarget(
      { kind: "direct", baseUrl: "https://agent.test/base" },
      { fetch: fetchImpl },
    )
    await connected.client.sendMessage({
      message: message("request", { role: "user" }),
    })

    expect(urls[0]).toBe("https://agent.test/base/.well-known/agent-card.json")
    expect(urls[1]).toBe("https://agent.test/custom-rpc")
    expect(connected.client.transport.constructor.name).toContain("JsonRpcTransport")
  })

  it("selects HTTP+JSON when advertised by a direct card", async () => {
    const urls: string[] = []
    const card: AgentCard = agentCard({
      preferredTransport: "HTTP+JSON",
      url: "https://agent.test/rest",
    })
    const fetchImpl = (async (input, init) => {
      urls.push(requestUrl(input))
      if (requestMethod(input, init) === "GET") {
        return new Response(JSON.stringify(card), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response(
        JSON.stringify({
          message: {
            messageId: "rest-response",
            role: "ROLE_AGENT",
            content: [{ text: "rest response" }],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )
    }) as typeof fetch

    const connected = await connectTarget(
      { kind: "direct", baseUrl: "https://agent.test" },
      { fetch: fetchImpl },
    )
    await connected.client.sendMessage({
      message: message("request", { role: "user" }),
    })

    expect(connected.client.transport.constructor.name).toContain("RestTransport")
    expect(urls[1]).toContain("https://agent.test/rest")
  })

  it("classifies failed proxy card responses", async () => {
    const failure = connectTarget(
      { kind: "proxy", targetId: "missing" },
      {
        fetch: (async () => new Response("missing", { status: 404 })) as unknown as typeof fetch,
      },
    )
    await expect(failure).rejects.toThrow("Agent card request failed (404)")
  })
})
