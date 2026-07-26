import { describe, expect, it } from "bun:test"
import { createFormEventRenderer, createFormPartRenderer, createFormResponseParts, FORM_EXTENSION_URI, isFormSpec, type FormSpec } from "./a2a-form"
import type { Conversation, ConversationId, TurnId } from "@mokronos/a2a-react"

const spec: FormSpec = { version: 1, id: "contact", title: "Contact", fields: [{ name: "name", label: "Name", required: true }, { name: "updates", label: "Receive updates", type: "boolean" }] }

describe("form helpers", () => {
  it("recognizes only explicitly versioned form specs", () => {
    expect(isFormSpec(spec)).toBe(true)
    expect(isFormSpec({ ...spec, version: 2 })).toBe(false)
  })

  it("creates readable text and namespaced versioned data", () => {
    const parts = createFormResponseParts(spec, { name: "Ada", updates: false })
    expect(parts[0]).toEqual({ kind: "text", text: "Name: Ada\nReceive updates: false" })
    expect(parts[1]).toMatchObject({ kind: "data", data: { extension: FORM_EXTENSION_URI, version: 1, formId: "contact", values: { name: "Ada", updates: false } }, metadata: { [FORM_EXTENSION_URI]: { version: 1 } } })
  })

  it("matches only the versioned opt-in form extension", () => {
    const turn = { id: "turn" as TurnId, request: { kind: "message" as const, messageId: "request", role: "user" as const, parts: [] }, events: [], artifacts: {}, lifecycle: { kind: "awaiting-input" as const, reason: "input-required" as const } }
    const conversation = { id: "conversation" as ConversationId, turns: [turn] } satisfies Conversation
    const renderer = createFormPartRenderer()
    const context = { conversation, turn, partIndex: 0, source: { kind: "request" as const, message: turn.request } }
    expect(renderer({ ...context, part: { kind: "data", data: { form: spec } } })).toBeUndefined()
    expect(renderer({ ...context, part: { kind: "data", data: { extension: FORM_EXTENSION_URI, version: 1, form: spec } } })).not.toBeNull()
  })

  it("matches versioned forms carried by awaiting-input status events", () => {
    const event = { kind: "status-update" as const, taskId: "task", contextId: "context", final: false, status: { state: "input-required" as const, message: { kind: "message" as const, messageId: "form", role: "agent" as const, parts: [{ kind: "data" as const, data: { extension: FORM_EXTENSION_URI, version: 1, form: spec } }] } } }
    const turn = { id: "turn" as TurnId, request: { kind: "message" as const, messageId: "request", role: "user" as const, parts: [] }, events: [event], artifacts: {}, lifecycle: { kind: "awaiting-input" as const, reason: "input-required" as const } }
    const conversation = { id: "conversation" as ConversationId, turns: [turn] } satisfies Conversation
    expect(createFormEventRenderer()({ event, eventIndex: 0, conversation, turn, source: { kind: "retained-event" } })).not.toBeUndefined()
  })
})
