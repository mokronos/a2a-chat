import { describe, expect, it } from "bun:test"

import { createJsonRpcClient, extractTask, resolveJsonRpcEndpoint } from "./helpers"

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

  it("connects to running test_agent via JSONRPC", async () => {
    const baseUrl = process.env.A2A_TEST_BASE_URL ?? "http://localhost:8000"
    const { client, agentName, endpoint } = await createJsonRpcClient(baseUrl)

    expect(endpoint.length).toBeGreaterThan(0)
    expect(agentName).toBeTruthy()
    if (!agentName) {
      throw new Error("Expected agent name from card")
    }

    const card = await client.getAgentCard()
    expect(card.name).toBe(agentName)
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
})
