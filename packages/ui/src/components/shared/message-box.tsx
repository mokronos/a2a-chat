import React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Spinner } from "../ui/spinner"

export type MessageStatusHistoryEntry = {
  id: string
  label: string
  at: number
}

export type MessageTimelineEvent = {
  id: string
  kind: string
  summary: string
  details?: string
  raw?: string
  at: number
}

export type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  thinkingText?: string
  status?: string
  isWorking?: boolean
  statusHistory?: MessageStatusHistoryEntry[]
  events?: MessageTimelineEvent[]
}

type MessageBoxProps = {
  messages: Message[]
}

function formatEventTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function MessageBox({ messages }: MessageBoxProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const endRef = React.useRef<HTMLDivElement>(null)
  const [expandedStatusHistory, setExpandedStatusHistory] = React.useState<Record<string, boolean>>({})

  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    container.scrollTop = container.scrollHeight

    const frameId = globalThis.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
      endRef.current?.scrollIntoView({ block: "end" })
    })

    return () => {
      globalThis.cancelAnimationFrame(frameId)
    }
  }, [messages])

  return (
    <div
      ref={containerRef}
      className="flex h-72 flex-col gap-3 overflow-auto rounded-md border border-border bg-background p-3"
    >
      {messages.map((message) => {
        const isUser = message.role === "user"
        const statusHistory = message.statusHistory ?? []
        const timelineEvents = message.events ?? []
        const isHistoryExpanded = expandedStatusHistory[message.id] === true
        const canExpandStatusHistory = statusHistory.length > 1

        return (
          <div
            key={message.id}
            className={isUser ? "ml-8 min-w-0 self-end" : "mr-8 min-w-0 self-start flex flex-col gap-1.5"}
          >
            {!isUser ? (
              <div className="min-w-0 overflow-hidden rounded-2xl rounded-bl-sm border border-border/60 bg-muted/70">
                <div className="inline-flex w-full items-center gap-2 border-b border-border/50 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                  {message.isWorking ? <Spinner className="size-3" aria-hidden="true" /> : <span className="size-2 rounded-full bg-muted-foreground/60" aria-hidden="true" />}
                  <span className="flex-1 truncate">{message.status ?? "Idle"}</span>
                  {canExpandStatusHistory ? (
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedStatusHistory((current) => ({
                          ...current,
                          [message.id]: !isHistoryExpanded,
                        }))
                      }}
                      className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/70"
                      aria-label={isHistoryExpanded ? "Collapse status history" : "Expand status history"}
                    >
                      <ChevronDownIcon className={`size-3 transition-transform ${isHistoryExpanded ? "rotate-180" : ""}`} />
                      <span>{statusHistory.length}</span>
                    </button>
                  ) : null}
                </div>
                {canExpandStatusHistory && isHistoryExpanded ? (
                  <div className="border-b border-border/40 bg-muted/30 px-2.5 py-1.5">
                    <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                      {statusHistory.map((statusItem) => (
                        <div key={statusItem.id} className="flex items-center gap-2">
                          <span className="font-mono opacity-80">{formatEventTime(statusItem.at)}</span>
                          <span>{statusItem.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {timelineEvents.length > 0 ? (
                  <div className="border-b border-border/40 bg-background/50 px-2.5 py-2">
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Event Timeline</div>
                    <div className="flex flex-col gap-1.5">
                      {timelineEvents.map((eventItem) => (
                        <details key={eventItem.id} className="rounded-md border border-border/40 bg-background/70 px-2 py-1">
                          <summary className="cursor-pointer list-none text-[11px] text-muted-foreground">
                            <span className="font-mono">{formatEventTime(eventItem.at)}</span>{" "}
                            <span className="font-medium text-foreground">{eventItem.kind}</span>{" "}
                            <span>{eventItem.summary}</span>
                          </summary>
                          {eventItem.details ? (
                            <div className="mt-1 text-[11px] text-muted-foreground">{eventItem.details}</div>
                          ) : null}
                          {eventItem.raw ? (
                            <pre className="mt-1 overflow-x-auto rounded-sm bg-muted/40 p-1 text-[10px] text-muted-foreground">
                              {eventItem.raw}
                            </pre>
                          ) : null}
                        </details>
                      ))}
                    </div>
                  </div>
                ) : null}
                {message.thinkingText && message.thinkingText.trim().length > 0 ? (
                  <div className="border-t border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap [overflow-wrap:anywhere]">
                    <span className="font-medium">Thinking:</span> {message.thinkingText}
                  </div>
                ) : null}
                {message.text.trim().length > 0 ? (
                  <div className="px-3 py-2 text-foreground whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {message.text}
                  </div>
                ) : null}
              </div>
            ) : null}
            {isUser && message.text.trim().length > 0 ? (
              <div
                className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground whitespace-pre-wrap [overflow-wrap:anywhere]"
              >
                {message.text}
              </div>
            ) : null}
          </div>
        )
      })}
      <div ref={endRef} aria-hidden="true" />
    </div>
  )
}

export { MessageBox }
