import type {
  A2AChat,
  A2AEvent,
  Conversation,
  SendCommand,
  Turn,
} from "@mokronos/a2a-react"

export type Part = SendCommand["parts"][number]
export type TextPart = Extract<Part, { kind: "text" }>
export type FilePart = Extract<Part, { kind: "file" }>
export type DataPart = Extract<Part, { kind: "data" }>
export type Message = Extract<A2AEvent, { kind: "message" }>
export type Task = Extract<A2AEvent, { kind: "task" }>

export type ControllerProp = { controller?: A2AChat }

export function latestAwaitingInputTurn(conversation: Conversation | undefined): Turn | undefined {
  return [...(conversation?.turns ?? [])]
    .reverse()
    .find((turn) => turn.lifecycle.kind === "awaiting-input")
}
