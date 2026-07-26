import { describe, expect, it } from "bun:test"
import type { ConnectionTarget } from "@mokronos/a2a-react"
import { connectionTargetChoices, resolveConnectionTarget, type A2AAgentSuggestion } from "./connection-form"

describe("connection target choices", () => {
  it("preserves direct, proxy, and provided-client suggestion targets", () => {
    const clientTarget = { kind: "client", client: {} } as ConnectionTarget
    const suggestions: A2AAgentSuggestion[] = [
      { id: "direct", label: "Direct", target: { kind: "direct", baseUrl: "https://agent.example" } },
      { id: "proxy", label: "Proxy", target: { kind: "proxy", targetId: "safe-agent", basePath: "/api/a2a" } },
      { id: "client", label: "Client", target: clientTarget },
    ]
    const choices = connectionTargetChoices({ suggestions })
    expect(resolveConnectionTarget("direct", "", choices)).toBe(suggestions[0]!.target)
    expect(resolveConnectionTarget("proxy", "", choices)).toBe(suggestions[1]!.target)
    expect(resolveConnectionTarget("client", "", choices)).toBe(clientTarget)
  })

  it("keeps a configured proxy selectable without direct URL entry", () => {
    const target = { kind: "proxy", targetId: "safe-agent" } as const
    const choices = connectionTargetChoices({ suggestions: [], configuredTarget: target })
    expect(choices).toHaveLength(1)
    expect(resolveConnectionTarget(choices[0]!.id, "", choices)).toBe(target)
  })

  it("retains the configured target after connecting to another target", () => {
    const configured = { kind: "proxy", targetId: "configured" } as const
    const current = { kind: "proxy", targetId: "current" } as const
    const choices = connectionTargetChoices({ suggestions: [], configuredTarget: configured, currentTarget: current })
    expect(choices.map((choice) => choice.target)).toEqual([current, configured])
  })
})
