import { describe, expect, it } from "bun:test"

import { resolveAgentCardUrl } from "./a2a"

describe("resolveAgentCardUrl", () => {
    it("resolves the agent card relative to the entered A2A base path", () => {
        const url = resolveAgentCardUrl(
            new URL("http://127.0.0.1:3000/agents/9d80ce8c-b2a0-4064-9b95-4700988f3e11/a2a")
        )

        expect(url.toString()).toBe(
            "http://127.0.0.1:3000/agents/9d80ce8c-b2a0-4064-9b95-4700988f3e11/a2a/.well-known/agent-card.json"
        )
    })
})
