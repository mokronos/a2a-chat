import { describe, expect, it } from "bun:test"
import type { Conversation, ConversationId, TurnId } from "@mokronos/a2a-react"
import { latestAwaitingInputTurn } from "./protocol"

describe("continuation selection", () => {
  it("selects the latest awaiting-input turn", () => {
    const turn = (id: string, kind: "completed" | "awaiting-input") => ({ id: id as TurnId, request: { kind: "message" as const, messageId: id, role: "user" as const, parts: [] }, events: [], artifacts: {}, lifecycle: kind === "completed" ? { kind } as const : { kind, reason: "input-required" as const } })
    const conversation = { id: "conversation" as ConversationId, turns: [turn("first", "awaiting-input"), turn("middle", "completed"), turn("latest", "awaiting-input")] } satisfies Conversation
    expect(String(latestAwaitingInputTurn(conversation)?.id)).toBe("latest")
  })
})
