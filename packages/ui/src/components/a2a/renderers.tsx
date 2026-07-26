"use client"

import * as React from "react"
import type { A2AEvent, A2AEventKind, Conversation, Turn } from "@mokronos/a2a-react"
import { FileIcon } from "lucide-react"
import { Response } from "../ai-elements/response"
import type { DataPart, FilePart, Message, Part } from "../../lib/protocol"

export type PartSource =
  | { kind: "request"; message: Message }
  | { kind: "message"; event: Message }
  | {
      kind: "reconstructed-artifact"
      artifact: Turn["artifacts"][string]
      artifactId: string
    }

export type PartRendererContext = {
  part: Part
  partIndex: number
  conversation: Conversation
  turn: Turn
  source: PartSource
}

export type EventRendererContext = {
  event: A2AEvent
  eventIndex: number
  conversation: Conversation
  turn: Turn
  source: { kind: "retained-event" }
}

export type PartRenderer = (context: PartRendererContext) => React.ReactNode
export type EventRenderer = (context: EventRendererContext) => React.ReactNode
export type ProtocolRenderEntry =
  | { kind: "event"; context: EventRendererContext }
  | { kind: "part"; context: PartRendererContext }

function partEntries(input: {
  parts: readonly Part[]
  source: PartSource
  conversation: Conversation
  turn: Turn
}): ProtocolRenderEntry[] {
  return input.parts.map((part, partIndex) => ({
    kind: "part",
    context: { part, partIndex, source: input.source, conversation: input.conversation, turn: input.turn },
  }))
}

export function turnProtocolEntries(conversation: Conversation, turn: Turn): ProtocolRenderEntry[] {
  const entries = partEntries({
    parts: turn.request.parts,
    source: { kind: "request", message: turn.request as Message },
    conversation,
    turn,
  })
  turn.events.forEach((event, eventIndex) => {
    entries.push({ kind: "event", context: { event, eventIndex, conversation, turn, source: { kind: "retained-event" } } })
    if (event.kind === "message") {
      entries.push(...partEntries({
        parts: event.parts,
        source: { kind: "message", event },
        conversation,
        turn,
      }))
    }
  })
  for (const artifact of Object.values(turn.artifacts)) {
    entries.push(...partEntries({
      parts: artifact.parts,
      source: { kind: "reconstructed-artifact", artifact, artifactId: artifact.artifactId },
      conversation,
      turn,
    }))
  }
  return entries
}

export function dispatchRenderers<Context>(
  context: Context,
  renderers: readonly ((context: Context) => React.ReactNode)[],
): React.ReactNode | undefined {
  for (const renderer of renderers) {
    try {
      const rendered = renderer(context)
      if (rendered !== null && rendered !== undefined) return rendered
    } catch {
      // A custom renderer only owns its own attempt; the item still gets a fallback.
    }
  }
  return undefined
}

export type ResolvedFileUri = {
  uri: string
  external?: boolean
}

export type FileUriResolver = (
  uri: string,
  context: PartRendererContext & { part: FilePart },
) => ResolvedFileUri | undefined

export const defaultFileUriResolver: FileUriResolver = (uri) => {
  try {
    const parsed = new URL(uri)
    if (!["http:", "https:", "blob:", "data:"].includes(parsed.protocol)) return undefined
    return { uri: parsed.href, external: parsed.protocol === "http:" || parsed.protocol === "https:" }
  } catch {
    return undefined
  }
}

function fileLabel(part: FilePart): string {
  if (part.file.name) return part.file.name
  return "uri" in part.file ? part.file.uri : "Download file"
}

export const renderTextPart: PartRenderer = ({ part }) =>
  part.kind === "text" ? <Response>{part.text}</Response> : undefined

export function createFilePartRenderer(resolveFileUri: FileUriResolver = defaultFileUriResolver): PartRenderer {
  return (context) => {
    if (context.part.kind !== "file") return undefined
    const part = context.part
    const resolved = "uri" in part.file
      ? resolveFileUri(part.file.uri, context as PartRendererContext & { part: FilePart })
      : {
          uri: `data:${part.file.mimeType ?? "application/octet-stream"};base64,${part.file.bytes}`,
          external: false,
        }
    const mimeType = part.file.mimeType ?? ""
    if (!resolved) {
      return <span className="a2a-file a2a-file-unavailable"><FileIcon aria-hidden="true" /><span>{fileLabel(part)}</span><small>Unavailable file URI</small></span>
    }
    if (mimeType.startsWith("image/")) {
      return <img src={resolved.uri} alt={part.file.name ?? "Image"} className="a2a-file-image" referrerPolicy="no-referrer" />
    }
    if (mimeType.startsWith("audio/")) return <audio controls src={resolved.uri} className="a2a-file-media" />
    if (mimeType.startsWith("video/")) return <video controls src={resolved.uri} className="a2a-file-media" />
    return (
      <a
        className="a2a-file"
        href={resolved.uri}
        target={resolved.external ? "_blank" : undefined}
        rel={resolved.external ? "noopener noreferrer" : undefined}
        referrerPolicy="no-referrer"
        download={resolved.external ? undefined : part.file.name ?? true}
      >
        <FileIcon aria-hidden="true" />
        <span>{fileLabel(part)}</span>
        {mimeType ? <small>{mimeType}</small> : null}
      </a>
    )
  }
}

export const renderFilePart = createFilePartRenderer()

export const renderDataPart: PartRenderer = ({ part }) =>
  part.kind === "data" ? <pre className="a2a-json">{JSON.stringify(part.data, null, 2)}</pre> : undefined

export const renderGenericToolPart: PartRenderer = ({ part }) => {
  if (part.kind !== "data") return undefined
  const type = part.data.type
  if (type !== "tool-call" && type !== "tool-result") return undefined
  const name = typeof part.data.toolName === "string" ? part.data.toolName : "tool"
  return <details className="a2a-tool"><summary>{type === "tool-call" ? `Calling ${name}` : `${name} result`}</summary><pre>{JSON.stringify(part.data, null, 2)}</pre></details>
}

export const defaultPartRenderers: readonly PartRenderer[] = [
  renderTextPart,
  renderFilePart,
  renderGenericToolPart,
  renderDataPart,
]

export function createDefaultPartRenderers(resolveFileUri?: FileUriResolver): readonly PartRenderer[] {
  return [renderTextPart, createFilePartRenderer(resolveFileUri), renderGenericToolPart, renderDataPart]
}

export const renderGenericEvent: EventRenderer = ({ event }) => {
  if (event.kind === "message") return <div className="a2a-event-label">Message received</div>
  if (event.kind === "task") {
    return <div className="a2a-event-label">Task {event.status.state}</div>
  }
  if (event.kind === "status-update") {
    return <div className="a2a-event-label">Status {event.status.state}{event.final ? " (final)" : ""}</div>
  }
  return <div className="a2a-event-label">Artifact {event.artifact.artifactId}</div>
}

export const defaultEventRenderers: readonly EventRenderer[] = [renderGenericEvent]

export type StandardSchemaV1<Input = unknown, Output = Input> = {
  readonly "~standard": {
    readonly version: 1
    readonly vendor: string
    readonly validate: (
      value: unknown,
    ) => { value: Output } | { issues: readonly unknown[] }
  }
}

export function createDataPartRenderer<Output>(input: {
  schema: StandardSchemaV1<unknown, Output>
  render: (data: Output, context: PartRendererContext & { part: DataPart }) => React.ReactNode
}): PartRenderer {
  return (context) => {
    if (context.part.kind !== "data") return undefined
    const result = input.schema["~standard"].validate(context.part.data)
    if ("issues" in result) return undefined
    return input.render(result.value, context as PartRendererContext & { part: DataPart })
  }
}

export function createExtensionPartRenderer(input: {
  uri?: string
  dataDiscriminator?: { key?: string; value: unknown }
  predicate?: (context: PartRendererContext) => boolean
  render: PartRenderer
}): PartRenderer {
  return (context) => {
    if (input.uri && context.part.metadata?.[input.uri] === undefined) return undefined
    if (input.dataDiscriminator) {
      if (context.part.kind !== "data") return undefined
      const key = input.dataDiscriminator.key ?? "type"
      if (context.part.data[key] !== input.dataDiscriminator.value) return undefined
    }
    if (input.predicate && !input.predicate(context)) return undefined
    return input.render(context)
  }
}

export function createEventRenderer(input: {
  kind?: A2AEventKind
  extensionUri?: string
  predicate?: (context: EventRendererContext) => boolean
  render: EventRenderer
}): EventRenderer {
  return (context) => {
    if (input.kind && context.event.kind !== input.kind) return undefined
    if (input.extensionUri) {
      const extensions = context.event.kind === "message" ? context.event.extensions : undefined
      const metadata = "metadata" in context.event ? context.event.metadata : undefined
      if (!extensions?.includes(input.extensionUri) && metadata?.[input.extensionUri] === undefined) return undefined
    }
    if (input.predicate && !input.predicate(context)) return undefined
    return input.render(context)
  }
}
