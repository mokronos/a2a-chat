import { describe, expect, it } from "bun:test"
import type { Artifact, Message, TaskStatusUpdateEvent } from "@a2a-js/sdk"
import {
  isA2AEvent,
  isTaskArtifactUpdateEvent,
  isTaskEvent,
  isTaskStatusUpdateEvent,
} from "./events"
import { conversationReducer, textParts, turnMessages, type Conversation, type Turn } from "./reducer"
import { conversationId, message, task, turnId } from "./test-helpers"

function initialTurn(): Turn {
  return {
    id: turnId(),
    request: message("request", { role: "user" }),
    events: [],
    artifacts: {},
    lifecycle: { kind: "running" },
  }
}

function initialConversation(turn = initialTurn()): Conversation {
  return { id: conversationId(), turns: [turn] }
}

function event(state: Conversation, value: Parameters<typeof conversationReducer>[1] & { kind: "event-received" }) {
  return conversationReducer(state, value)
}

describe("A2A event guards", () => {
  it("accepts tasks without optional artifacts", () => {
    expect(isTaskEvent(task())).toBe(true)
    expect(isA2AEvent(task())).toBe(true)
  })

  it("requires status final and valid artifact parts", () => {
    expect(
      isTaskStatusUpdateEvent({
        kind: "status-update",
        taskId: "task-1",
        contextId: "context-1",
        status: { state: "working" },
      }),
    ).toBe(false)
    expect(
      isTaskArtifactUpdateEvent({
        kind: "artifact-update",
        taskId: "task-1",
        contextId: "context-1",
        artifact: { artifactId: "artifact-1", parts: [{ kind: "text", text: 42 }] },
      }),
    ).toBe(false)
  })
})

describe("conversationReducer", () => {
  it("ignores artifact updates owned by another task or context", () => {
    const turn = { ...initialTurn(), taskId: "task-1", contextId: "context-1" }
    const initial = initialConversation(turn)
    let state = initial
    state = event(state, {
      kind: "event-received",
      turnId: turn.id,
      event: {
        kind: "artifact-update",
        taskId: "task-2",
        contextId: "context-1",
        artifact: { artifactId: "wrong-task", parts: [] },
      },
    })
    state = event(state, {
      kind: "event-received",
      turnId: turn.id,
      event: {
        kind: "artifact-update",
        taskId: "task-1",
        contextId: "context-2",
        artifact: { artifactId: "wrong-context", parts: [] },
      },
    })

    expect(state).toBe(initial)
    expect(state.turns[0]?.events).toHaveLength(0)
    expect(state.turns[0]?.artifacts).toEqual({})
  })

  it("preserves and merges artifact metadata when appending", () => {
    const first: Artifact = {
      artifactId: "artifact-1",
      name: "report",
      description: "initial",
      metadata: { stable: true, changed: "old" },
      parts: [{ kind: "text", text: "one" }],
    }
    let state = initialConversation()
    state = event(state, {
      kind: "event-received",
      turnId: turnId(),
      event: {
        kind: "artifact-update",
        taskId: "task-1",
        contextId: "context-1",
        artifact: first,
      },
    })
    state = event(state, {
      kind: "event-received",
      turnId: turnId(),
      event: {
        kind: "artifact-update",
        taskId: "task-1",
        contextId: "context-1",
        append: true,
        artifact: {
          artifactId: "artifact-1",
          metadata: { changed: "new" },
          parts: [{ kind: "text", text: "two" }],
        },
      },
    })

    expect(state.turns[0]?.artifacts["artifact-1"]).toMatchObject({
      name: "report",
      description: "initial",
      metadata: { stable: true, changed: "new" },
    })
    expect(state.turns[0]?.artifacts["artifact-1"]?.parts).toHaveLength(2)
  })

  it("does not replace streamed artifacts with stale task snapshots", () => {
    const streamed: Artifact = {
      artifactId: "artifact-1",
      name: "complete",
      parts: [{ kind: "text", text: "one" }, { kind: "text", text: "two" }],
    }
    let state = initialConversation()
    state = event(state, {
      kind: "event-received",
      turnId: turnId(),
      event: {
        kind: "artifact-update",
        taskId: "task-1",
        contextId: "context-1",
        artifact: streamed,
      },
    })
    state = event(state, {
      kind: "event-received",
      turnId: turnId(),
      event: task({
        artifacts: [
          { artifactId: "artifact-1", parts: [{ kind: "text", text: "stale" }] },
          { artifactId: "artifact-2", parts: [{ kind: "text", text: "snapshot" }] },
        ],
      }),
    })

    expect(state.turns[0]?.artifacts["artifact-1"]).toEqual(streamed)
    expect(state.turns[0]?.artifacts["artifact-2"]?.parts).toHaveLength(1)
    expect(state.turns[0]?.task?.artifacts).toEqual(Object.values(state.turns[0]?.artifacts ?? {}))
  })

  it("allows newer snapshots to refresh artifacts that were never streamed", () => {
    let state = event(initialConversation(), {
      kind: "event-received",
      turnId: turnId(),
      event: task({
        artifacts: [{ artifactId: "snapshot-only", parts: [{ kind: "text", text: "old" }] }],
      }),
    })
    state = event(state, {
      kind: "event-received",
      turnId: turnId(),
      event: task({
        artifacts: [{ artifactId: "snapshot-only", parts: [{ kind: "text", text: "new" }] }],
      }),
    })

    expect(state.turns[0]?.artifacts["snapshot-only"]?.parts).toEqual([
      { kind: "text", text: "new" },
    ])
  })

  it("handles terminal status updates before a full task", () => {
    const update: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId: "task-1",
      contextId: "context-1",
      final: true,
      status: {
        state: "failed",
        message: message("remote failure"),
      },
    }
    const state = event(initialConversation(), {
      kind: "event-received",
      turnId: turnId(),
      event: update,
    })

    expect(state.turns[0]?.task).toMatchObject({ id: "task-1", contextId: "context-1" })
    expect(state.turns[0]?.statusFinal).toBe(true)
    expect(state.turns[0]?.lifecycle).toEqual({ kind: "failed", error: "remote failure" })
  })

  it("does not let an incomplete snapshot regress a final status", () => {
    let state = event(initialConversation(), {
      kind: "event-received",
      turnId: turnId(),
      event: {
        kind: "status-update",
        taskId: "task-1",
        contextId: "context-1",
        final: true,
        status: { state: "completed" },
      },
    })
    state = event(state, {
      kind: "event-received",
      turnId: turnId(),
      event: task({ status: { state: "working" } }),
    })

    expect(state.turns[0]?.task?.status.state).toBe("completed")
    expect(state.turns[0]?.lifecycle.kind).toBe("completed")
  })

  it("sets bare message context and completes the turn", () => {
    const response: Message = message("complete", { contextId: "context-from-message" })
    const state = event(initialConversation(), {
      kind: "event-received",
      turnId: turnId(),
      event: response,
    })

    expect(state.turns[0]?.contextId).toBe("context-from-message")
    expect(state.turns[0]?.lifecycle.kind).toBe("completed")
    expect(turnMessages(state.turns[0]!)).toEqual([state.turns[0]!.request, response])
  })

  it("retains repeated text exactly without parsing JSON-looking content", () => {
    const parts = [
      { kind: "text" as const, text: '{"value":1}' },
      { kind: "text" as const, text: '{"value":1}' },
      { kind: "data" as const, data: { value: 1 } },
    ]
    expect(textParts(parts)).toEqual(['{"value":1}', '{"value":1}'])
  })
})
