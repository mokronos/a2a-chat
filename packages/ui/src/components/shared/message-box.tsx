import React from "react"

import { Spinner } from "../ui/spinner"

export type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  status?: string
  isWorking?: boolean
}

type MessageBoxProps = {
  messages: Message[]
}

function MessageBox({ messages }: MessageBoxProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const endRef = React.useRef<HTMLDivElement>(null)

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

        return (
          <div
            key={message.id}
            className={isUser ? "ml-8 self-end" : "mr-8 self-start flex flex-col gap-1.5"}
          >
            {!isUser ? (
              <div className="overflow-hidden rounded-2xl rounded-bl-sm border border-border/60 bg-muted/70">
                <div className="inline-flex w-full items-center gap-2 border-b border-border/50 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                  {message.isWorking ? (
                    <Spinner className="size-3" aria-hidden="true" />
                  ) : (
                    <span className="size-2 rounded-full bg-muted-foreground/60" aria-hidden="true" />
                  )}
                  <span>{message.status ?? "Idle"}</span>
                </div>
                {message.text.trim().length > 0 ? (
                  <div className="px-3 py-2 text-foreground">{message.text}</div>
                ) : null}
              </div>
            ) : null}
            {isUser && message.text.trim().length > 0 ? (
              <div
                className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
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
