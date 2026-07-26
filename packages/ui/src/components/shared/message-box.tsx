"use client"

import * as React from "react"
import type { Conversation, Turn } from "@mokronos/a2a-react"
import { MessageSquareIcon } from "lucide-react"
import {
  createDefaultPartRenderers,
  defaultEventRenderers,
  dispatchRenderers,
  turnProtocolEntries,
  type EventRenderer,
  type FileUriResolver,
  type PartRenderer,
  type PartRendererContext,
} from "../a2a/renderers"
import { cn } from "../../lib/utils"

export type MessageTimelineEventRenderer = EventRenderer

type PartGroup = {
  contexts: PartRendererContext[]
  source: PartRendererContext["source"]
}

function partGroups(turn: Turn, conversation: Conversation): PartGroup[] {
  const groups: PartGroup[] = []
  for (const entry of turnProtocolEntries(conversation, turn)) {
    if (entry.kind !== "part") continue
    const previous = groups.at(-1)
    if (previous?.source === entry.context.source) previous.contexts.push(entry.context)
    else groups.push({ contexts: [entry.context], source: entry.context.source })
  }
  return groups
}

function Parts({ group, renderers }: { group: PartGroup; renderers: readonly PartRenderer[] }) {
  return group.contexts.map((context) => {
    const rendered = dispatchRenderers(context, renderers)
    return rendered === undefined ? null : (
      <div className="a2a-part" key={`${context.part.kind}-${context.partIndex}`}>{rendered}</div>
    )
  })
}

function EventTimeline({
  conversation,
  turn,
  customRenderers,
}: {
  conversation: Conversation
  turn: Turn
  customRenderers: readonly EventRenderer[]
}) {
  const custom: { key: string; node: React.ReactNode }[] = []
  const fallback: { key: string; node: React.ReactNode }[] = []
  for (const entry of turnProtocolEntries(conversation, turn)) {
    if (entry.kind !== "event") continue
    const key = `${entry.context.event.kind}-${entry.context.eventIndex}`
    const customNode = dispatchRenderers(entry.context, customRenderers)
    if (customNode !== undefined) {
      if (customNode !== false && customNode !== "") custom.push({ key, node: customNode })
      continue
    }
    const fallbackNode = dispatchRenderers(entry.context, defaultEventRenderers)
    if (fallbackNode !== undefined) fallback.push({ key, node: fallbackNode })
  }
  if (custom.length === 0 && fallback.length === 0) return null
  return (
    <>
      {custom.map(({ key, node }) => <div className="a2a-custom-event" key={key}>{node}</div>)}
      {fallback.length > 0 ? (
        <details className="a2a-event-timeline">
          <summary>Activity ({fallback.length})</summary>
          <div className="a2a-event-timeline-content">
            {fallback.map(({ key, node }) => <div className="a2a-event-summary" key={key}>{node}</div>)}
          </div>
        </details>
      ) : null}
    </>
  )
}

export type MessageBoxProps = {
  conversation: Conversation
  eventRenderers?: readonly EventRenderer[]
  partRenderers?: readonly PartRenderer[]
  fileUriResolver?: FileUriResolver
  className?: string
  contentClassName?: string
}

export function MessageBox({
  conversation,
  eventRenderers,
  partRenderers,
  fileUriResolver,
  className,
  contentClassName,
}: MessageBoxProps) {
  const defaults = createDefaultPartRenderers(fileUriResolver)
  const resolvedPartRenderers = partRenderers ? [...partRenderers, ...defaults] : defaults
  const endRef = React.useRef<HTMLDivElement>(null)
  const eventCount = conversation.turns.reduce((sum, turn) => sum + turn.events.length, 0)
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" })
  }, [conversation.turns.length, eventCount])

  if (conversation.turns.length === 0) {
    return <div className={cn("a2a-empty", className)}><MessageSquareIcon aria-hidden="true" /><p>No messages yet</p></div>
  }

  return (
    <div className={cn("a2a-messages", className)} role="log" aria-live="polite" aria-relevant="additions text">
      <div className={cn("a2a-message-column", contentClassName)}>
        {conversation.turns.map((turn) => {
          const groups = partGroups(turn, conversation)
          const request = groups.filter((group) => group.source.kind === "request")
          const answers = groups.filter((group) => group.source.kind !== "request")
          return (
            <section className="a2a-turn" key={turn.id} aria-label={`Turn ${turn.lifecycle.kind}`}>
              {request.map((group, index) => <article className="a2a-answer" data-role="user" key={`request-${index}`}><Parts group={group} renderers={resolvedPartRenderers} /></article>)}
              <EventTimeline conversation={conversation} turn={turn} customRenderers={eventRenderers ?? []} />
              {answers.map((group, index) => <article className="a2a-answer" data-role="agent" data-source={group.source.kind} key={`${group.source.kind}-${index}`}><Parts group={group} renderers={resolvedPartRenderers} /></article>)}
              <p className="a2a-turn-status" role="status">{turn.lifecycle.kind === "failed" ? turn.lifecycle.error : turn.lifecycle.kind}</p>
            </section>
          )
        })}
        <div ref={endRef} />
      </div>
    </div>
  )
}
