import { describe, expect, it } from "bun:test"

import { createJsonRpcClient, extractTask, resolveJsonRpcEndpoint } from "./helpers"
import { createProxyTransport } from "./proxy"

describe("A2A JSONRPC helpers", () => {
  it("prefers JSONRPC interface from agent card", () => {
    const endpoint = resolveJsonRpcEndpoint("http://localhost:8000", {
      supportedInterfaces: [
        {
          protocolBinding: "HTTP+JSON",
          url: "http://localhost:8000/rest",
        },
        {
          protocolBinding: "JSONRPC",
          url: "http://localhost:8000/jsonrpc",
        },
      ],
    })

    expect(endpoint).toBe("http://localhost:8000/jsonrpc")
  })

  it("builds a proxy-backed JSONRPC client", async () => {
    const baseUrl = "http://localhost:8000"
    const transport = createProxyTransport("/api/a2a")
    const originalFetch = globalThis.fetch
    let capturedFetchUrl: string | null = null

    const mockFetch = Object.assign(
      async (input: RequestInfo | URL) => {
        capturedFetchUrl = typeof input === "string" ? input : input.toString()

        return new Response(
          JSON.stringify({
            name: "Test Agent",
            defaultOutputModes: ["application/json"],
            supportedInterfaces: [
              {
                protocolBinding: "JSONRPC",
                url: "/rpc",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      },
      {
        preconnect: () => {},
      }
    )

    globalThis.fetch = mockFetch as typeof fetch

    try {
      const { client, agentName, endpoint } = await createJsonRpcClient(baseUrl, transport)

      expect(capturedFetchUrl).not.toBeNull()
      if (!capturedFetchUrl) {
        throw new Error("Expected proxy fetch URL")
      }
      const fetchUrl = capturedFetchUrl as string
      expect(fetchUrl).toBe("/api/a2a/agent-card?target=http%3A%2F%2Flocalhost%3A8000")
      expect(endpoint).toBe("http://localhost:8000/rpc")
      expect(agentName).toBe("Test Agent")

      const card = await client.getAgentCard()
      expect(card.name).toBe("Test Agent")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("extracts task from wrapped payload", () => {
    const task = extractTask({
      task: {
        id: "task-1",
        contextId: "ctx-1",
        status: { state: "submitted", timestamp: "2026-01-01T00:00:00Z" },
      },
    })

    expect(task?.id).toBe("task-1")
    expect(task?.status.state).toBe("submitted")
  })

  it("extracts snake_case context id as contextId", () => {
    const task = extractTask({
      task: {
        id: "task-2",
        context_id: "ctx-2",
        status: { state: "working", timestamp: "2026-01-01T00:00:00Z" },
      },
    })

    expect(task?.id).toBe("task-2")
    expect(task?.contextId).toBe("ctx-2")
    expect(task?.status.state).toBe("working")
  })
})
