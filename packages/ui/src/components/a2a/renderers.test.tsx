import * as React from "react"
import { describe, expect, it } from "bun:test"
import type { Conversation, ConversationId, Turn, TurnId } from "@mokronos/a2a-react"
import {
  createFilePartRenderer,
  dispatchRenderers,
  turnProtocolEntries,
  type PartRendererContext,
} from "./renderers"
import type { Part } from "../../lib/protocol"
import { inspectorEventRenderers, inspectorPartRenderers } from "./inspector-event-renderers"

function makeTurn(input: Partial<Turn> = {}): Turn {
  return {
    id: "turn-1" as TurnId,
    request: { kind: "message", messageId: "request", role: "user", parts: [{ kind: "text", text: "request" }] },
    events: [],
    artifacts: {},
    lifecycle: { kind: "running" },
    ...input,
  }
}

function makeConversation(turn: Turn): Conversation {
  return { id: "conversation-1" as ConversationId, turns: [turn] }
}

function projected(turn: Turn) {
  const conversation = makeConversation(turn)
  return turnProtocolEntries(conversation, turn).flatMap((entry) =>
    entry.kind === "part" && entry.context.source.kind !== "request" ? [entry.context] : [],
  )
}

function projectedParts(turn: Turn): Part[] {
  return projected(turn).map((context) => context.part)
}

describe("turn projection", () => {
  it("keeps every retained event reachable without projecting streamed chunks or an overlapping Task snapshot", () => {
    const turn = makeTurn({
      events: [
        { kind: "artifact-update", taskId: "task", contextId: "context", append: false, artifact: { artifactId: "answer", parts: [{ kind: "text", text: "H" }] } },
        { kind: "artifact-update", taskId: "task", contextId: "context", append: true, artifact: { artifactId: "answer", parts: [{ kind: "text", text: "i" }] } },
        { kind: "task", id: "task", contextId: "context", status: { state: "completed" }, artifacts: [{ artifactId: "answer", parts: [{ kind: "text", text: "Hi" }] }] },
      ],
      artifacts: { answer: { artifactId: "answer", parts: [{ kind: "text", text: "H" }, { kind: "text", text: "i" }] } },
      lifecycle: { kind: "completed" },
    })
    const entries = turnProtocolEntries(makeConversation(turn), turn)
    expect(entries.filter((entry) => entry.kind === "event")).toHaveLength(3)
    expect(projectedParts(turn)).toEqual([{ kind: "text", text: "H" }, { kind: "text", text: "i" }])
    expect(projected(turn).every((context) => context.source.kind === "reconstructed-artifact")).toBe(true)
  })

  it("projects only the reconstructed replacement artifact", () => {
    const turn = makeTurn({
      events: [
        { kind: "artifact-update", taskId: "task", contextId: "context", artifact: { artifactId: "answer", parts: [{ kind: "text", text: "old" }] } },
        { kind: "artifact-update", taskId: "task", contextId: "context", append: false, artifact: { artifactId: "answer", parts: [{ kind: "text", text: "new" }] } },
      ],
      artifacts: { answer: { artifactId: "answer", parts: [{ kind: "text", text: "new" }] } },
    })
    expect(projectedParts(turn)).toEqual([{ kind: "text", text: "new" }])
  })

  it("preserves repeated identical bare Message outputs intentionally", () => {
    const message = (id: string) => ({ kind: "message" as const, messageId: id, role: "agent" as const, parts: [{ kind: "text" as const, text: "same" }] })
    const turn = makeTurn({ events: [message("one"), message("two")] })
    expect(projectedParts(turn)).toEqual([{ kind: "text", text: "same" }, { kind: "text", text: "same" }])
    expect(projected(turn).map((context) => context.source.kind)).toEqual(["message", "message"])
  })

  it("projects bare file and data Message Parts exactly once", () => {
    const turn = makeTurn({
      events: [{
        kind: "message",
        messageId: "files",
        role: "agent",
        parts: [
          { kind: "file", file: { uri: "https://example.com/result.pdf", mimeType: "application/pdf" } },
          { kind: "data", data: { result: 42 } },
        ],
      }],
    })
    expect(projectedParts(turn).map((part) => part.kind)).toEqual(["file", "data"])
  })

  it("does not project status process data or Task history/status messages as answer content", () => {
    const processMessage = { kind: "message" as const, messageId: "process", role: "agent" as const, parts: [{ kind: "data" as const, data: { type: "thinking", text: "working" } }] }
    const turn = makeTurn({
      events: [
        { kind: "status-update", taskId: "task", contextId: "context", final: false, status: { state: "working", message: processMessage } },
        { kind: "task", id: "task", contextId: "context", status: { state: "working", message: processMessage }, history: [processMessage] },
      ],
    })
    expect(projectedParts(turn)).toEqual([])
    expect(turnProtocolEntries(makeConversation(turn), turn).filter((entry) => entry.kind === "event")).toHaveLength(2)
  })
})

describe("renderer dispatch", () => {
  const turn = makeTurn()
  const conversation = makeConversation(turn)
  const base = { conversation, turn, partIndex: 0, source: { kind: "request" as const, message: turn.request } }

  it("treats false and empty strings as handled and isolates exceptions", () => {
    expect(dispatchRenderers({}, [() => false, () => "later"])).toBe(false)
    expect(dispatchRenderers({}, [() => "", () => "later"])).toBe("")
    expect(dispatchRenderers({}, [() => { throw new Error("broken") }, () => null, () => "fallback"])).toBe("fallback")
  })

  it("keeps inspector tool renderers opt-in and DataPart-specific", () => {
    expect(dispatchRenderers({ ...base, part: { kind: "text", text: "send_task" } as const }, inspectorPartRenderers)).toBeUndefined()
    expect(dispatchRenderers({ ...base, part: { kind: "data", data: { type: "tool-call", toolName: "send_task" } } as const }, inspectorPartRenderers)).not.toBeUndefined()
    const event = { kind: "status-update" as const, taskId: "task", contextId: "context", final: false, status: { state: "working" as const, message: { kind: "message" as const, messageId: "tool", role: "agent" as const, parts: [{ kind: "data" as const, data: { type: "tool-call", toolName: "send_task" } }] } } }
    expect(dispatchRenderers({ event, eventIndex: 0, conversation, turn, source: { kind: "retained-event" as const } }, inspectorEventRenderers)).not.toBeUndefined()
  })

  it("rejects unsafe remote file schemes and permits an explicit custom resolver", () => {
    const part = { kind: "file", file: { uri: "javascript:alert(1)", name: "unsafe.txt" } } as const
    const context = { ...base, part } satisfies PartRendererContext
    const blocked = createFilePartRenderer()(context)
    expect(React.isValidElement(blocked) && blocked.type).toBe("span")
    const allowed = createFilePartRenderer(() => ({ uri: "https://safe.example/file", external: true }))(context)
    expect(React.isValidElement(allowed) && allowed.type).toBe("a")
    expect(React.isValidElement(allowed) && (allowed.props as { referrerPolicy?: string }).referrerPolicy).toBe("no-referrer")
  })
})
