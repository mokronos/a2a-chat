import React from "react"
import { DownloadIcon, FileIcon } from "lucide-react"

import type { RenderablePart } from "@mokronos/a2a-react"
import { CodeBlock } from "../ai-elements/code-block"
import { cn } from "../../lib/utils"

/**
 * Turns one {@link RenderablePart} into a React node. Return `null`/`undefined`
 * to defer to the next renderer in the chain. This mirrors the timeline
 * `MessageTimelineEventRenderer` pattern: pass an array, first non-null wins.
 */
export type A2APartRenderer = (part: RenderablePart) => React.ReactNode

function fileSource(part: Extract<RenderablePart, { kind: "file" }>): string | null {
  if (part.uri) {
    return part.uri
  }
  if (part.bytes) {
    return `data:${part.mimeType ?? "application/octet-stream"};base64,${part.bytes}`
  }
  return null
}

function ImagePart({ part }: { part: Extract<RenderablePart, { kind: "file" }> }) {
  const src = fileSource(part)
  if (!src) {
    return null
  }

  return (
    <figure className="min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={part.name ?? "Generated image"}
        className="max-h-96 w-auto max-w-full rounded-lg border border-border object-contain"
      />
      {part.name ? (
        <figcaption className="mt-1 text-xs text-muted-foreground">{part.name}</figcaption>
      ) : null}
    </figure>
  )
}

function FileDownloadPart({ part }: { part: Extract<RenderablePart, { kind: "file" }> }) {
  const src = fileSource(part)
  if (!src) {
    return null
  }

  return (
    <a
      href={src}
      download={part.name ?? true}
      target={part.uri ? "_blank" : undefined}
      rel={part.uri ? "noreferrer" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm no-underline transition-colors hover:bg-muted"
      )}
    >
      <FileIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{part.name ?? "Download file"}</span>
        {part.mimeType ? (
          <span className="truncate text-xs text-muted-foreground">{part.mimeType}</span>
        ) : null}
      </span>
      <DownloadIcon className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </a>
  )
}

/** Renders `file` parts: images/audio/video inline, everything else as a download card. */
export const renderFilePart: A2APartRenderer = (part) => {
  if (part.kind !== "file") {
    return null
  }

  const mimeType = part.mimeType ?? ""
  const src = fileSource(part)
  if (!src) {
    return null
  }

  if (mimeType.startsWith("image/")) {
    return <ImagePart part={part} />
  }

  if (mimeType.startsWith("audio/")) {
    return <audio controls src={src} className="w-full" />
  }

  if (mimeType.startsWith("video/")) {
    return <video controls src={src} className="max-h-96 w-full rounded-lg border border-border" />
  }

  return <FileDownloadPart part={part} />
}

/** Renders structured `data` parts as a formatted JSON block (fallback renderer). */
export const renderDataPart: A2APartRenderer = (part) => {
  if (part.kind !== "data") {
    return null
  }

  return (
    <CodeBlock
      code={JSON.stringify(part.data, null, 2)}
      language="json"
      className="text-[11px]"
    />
  )
}

/**
 * Default content renderers, tried in order. Prepend your own to handle custom
 * `data.type` shapes (charts, tables, cards) before the JSON fallback.
 */
export const defaultPartRenderers: A2APartRenderer[] = [renderFilePart, renderDataPart]

export function renderPart(part: RenderablePart, renderers: A2APartRenderer[]): React.ReactNode {
  for (const render of renderers) {
    const rendered = render(part)
    if (rendered) {
      return rendered
    }
  }
  return null
}
