"use client"

import * as React from "react"
import type { A2AEvent } from "@mokronos/a2a-react"
import { createDataPartRenderer, type EventRenderer, type PartRenderer } from "./renderers"
import type { DataPart, Part } from "../../lib/protocol"

const inspectorTools = new Set(["send_task", "check_task_status"])

function isInspectorToolPart(part: Part): part is DataPart {
  return part.kind === "data" && typeof part.data.toolName === "string" && inspectorTools.has(part.data.toolName)
}

function renderTool(part: DataPart): React.ReactNode {
  const name = String(part.data.toolName)
  return <details className="a2a-tool"><summary>{name}</summary><pre>{JSON.stringify(part.data, null, 2)}</pre></details>
}

function eventParts(event: A2AEvent): Part[] {
  if (event.kind === "status-update") return [...(event.status.message?.parts ?? [])]
  if (event.kind !== "task") return []
  return [
    ...(event.status.message?.parts ?? []),
    ...(event.history ?? []).flatMap((message) => message.parts),
  ]
}

function toolPartRenderer(toolName: "send_task" | "check_task_status"): PartRenderer {
  return createDataPartRenderer<Record<string, unknown>>({
    schema: {
      "~standard": {
        version: 1,
        vendor: "mokronos-inspector",
        validate(value) {
          const data = value as Record<string, unknown>
          return typeof data === "object" && data !== null && data.toolName === toolName
            ? { value: data }
            : { issues: [{}] }
        },
      },
    },
    render(data) { return renderTool({ kind: "data", data }) },
  })
}

export const inspectorPartRenderers: readonly PartRenderer[] = [
  toolPartRenderer("send_task"),
  toolPartRenderer("check_task_status"),
]

export const inspectorEventRenderers: readonly EventRenderer[] = [
  ({ event }) => {
    const parts = eventParts(event).filter(isInspectorToolPart)
    return parts.length > 0 ? <div className="a2a-inspector-events">{parts.map((part, index) => <React.Fragment key={index}>{renderTool(part)}</React.Fragment>)}</div> : undefined
  },
]
