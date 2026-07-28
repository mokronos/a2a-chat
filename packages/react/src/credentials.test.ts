import { afterEach, describe, expect, it } from "bun:test"
import { agentAuthRequirement, credentialHeaders, credentialKey } from "./credentials"
import { A2AChatRuntime } from "./runtime"
import { agentCard } from "./test-helpers"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

const bearerCard = agentCard({
  security: [{ bearer: [] }],
  securitySchemes: {
    bearer: { type: "http", scheme: "Bearer", description: "Shared inspector token" },
  },
})

function cardResponder(card = bearerCard, status = 200) {
  const requests: Headers[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(input instanceof Request ? input.headers : new Headers(init?.headers))
    return new Response(JSON.stringify(card), {
      status,
      headers: { "content-type": "application/json" },
    })
  }) as typeof fetch
  return requests
}

describe("agentAuthRequirement", () => {
  it("reads a bearer scheme the user can satisfy with a pasted token", () => {
    expect(agentAuthRequirement(bearerCard)).toEqual({
      schemeName: "bearer",
      kind: "bearer",
      header: "authorization",
      prefix: "Bearer ",
      description: "Shared inspector token",
    })
  })

  it("reads an api key scheme and its header name", () => {
    const card = agentCard({
      security: [{ key: [] }],
      securitySchemes: { key: { type: "apiKey", in: "header", name: "X-API-Key" } },
    })

    expect(agentAuthRequirement(card)).toMatchObject({
      kind: "apiKey",
      header: "x-api-key",
      prefix: "",
    })
  })

  it("ignores schemes that need a flow rather than a secret, and cards without security", () => {
    const oauth = agentCard({
      security: [{ oauth: ["read"] }],
      securitySchemes: {
        oauth: { type: "oauth2", flows: { clientCredentials: { tokenUrl: "https://a.test/t", scopes: {} } } },
      },
    })

    expect(agentAuthRequirement(oauth)).toBeUndefined()
    expect(agentAuthRequirement(agentCard())).toBeUndefined()
    expect(agentAuthRequirement(agentCard({ security: [{ missing: [] }] }))).toBeUndefined()
  })
})

describe("credentialHeaders", () => {
  it("hands the secret to the proxy without naming an upstream header", () => {
    expect(
      credentialHeaders({
        target: { kind: "proxy", targetId: "local" },
        credential: "secret",
        requirement: agentAuthRequirement(bearerCard),
      }),
    ).toEqual({ "x-a2a-credential": "secret" })
  })

  it("applies the card's own scheme on a direct connection", () => {
    const apiKeyRequirement = agentAuthRequirement(
      agentCard({
        security: [{ key: [] }],
        securitySchemes: { key: { type: "apiKey", in: "header", name: "X-API-Key" } },
      }),
    )

    expect(
      credentialHeaders({
        target: { kind: "direct", baseUrl: "https://agent.test" },
        credential: "secret",
        requirement: apiKeyRequirement,
      }),
    ).toEqual({ "x-api-key": "secret" })
  })

  it("sends nothing without a credential", () => {
    expect(
      credentialHeaders({
        target: { kind: "proxy", targetId: "local" },
        credential: undefined,
        requirement: undefined,
      }),
    ).toEqual({})
  })
})

describe("credentialKey", () => {
  it("separates agents so one browser can hold several credentials", () => {
    expect(credentialKey({ kind: "proxy", targetId: "a" })).not.toBe(
      credentialKey({ kind: "proxy", targetId: "b" }),
    )
    expect(credentialKey({ kind: "direct", baseUrl: "https://agent.test" })).toBe(
      "direct:https://agent.test",
    )
  })
})

describe("runtime credentials", () => {
  it("reports the card's requirement and prompts when no credential is stored", async () => {
    cardResponder()
    const runtime = new A2AChatRuntime({ credentialStorage: null })

    await runtime.connect({ kind: "proxy", targetId: "local" })

    expect(runtime.auth.status).toBe("required")
    expect(runtime.auth.hasCredential).toBe(false)
    expect(runtime.auth.requirement?.kind).toBe("bearer")
  })

  it("attaches a credential set after connecting to later requests", async () => {
    const requests = cardResponder()
    const runtime = new A2AChatRuntime({ credentialStorage: null })
    await runtime.connect({ kind: "proxy", targetId: "local" })
    expect(requests[0]?.get("x-a2a-credential")).toBeNull()

    runtime.setCredential("  pasted-token  ")
    expect(runtime.auth.status).toBe("provided")

    await runtime.connect({ kind: "proxy", targetId: "local" })

    expect(requests[1]?.get("x-a2a-credential")).toBe("pasted-token")
    expect(runtime.auth.status).toBe("accepted")
  })

  it("marks a rejected credential when the agent answers 401", async () => {
    cardResponder(bearerCard, 401)
    const runtime = new A2AChatRuntime({ credentialStorage: null })
    runtime.setCredential("wrong-token")

    await expect(runtime.connect({ kind: "proxy", targetId: "local" })).rejects.toThrow()

    expect(runtime.auth.status).toBe("rejected")
    expect(runtime.auth.hasCredential).toBe(true)
  })

  it("restores a stored credential per target and clears it on request", async () => {
    cardResponder()
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    }

    const first = new A2AChatRuntime({ credentialStorage: storage })
    await first.connect({ kind: "proxy", targetId: "local" })
    first.setCredential("stored-token")

    const second = new A2AChatRuntime({ credentialStorage: storage })
    await second.connect({ kind: "proxy", targetId: "local" })
    expect(second.auth.hasCredential).toBe(true)

    const other = new A2AChatRuntime({ credentialStorage: storage })
    await other.connect({ kind: "proxy", targetId: "other" })
    expect(other.auth.hasCredential).toBe(false)

    second.clearCredential()
    const reloaded = new A2AChatRuntime({ credentialStorage: storage })
    await reloaded.connect({ kind: "proxy", targetId: "local" })
    expect(reloaded.auth.hasCredential).toBe(false)
  })
})
