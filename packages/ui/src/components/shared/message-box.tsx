import React from "react"
import { MessageSquareIcon } from "lucide-react"
import type { Message, MessageTimelineEvent } from "@mokronos/a2a-react"

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "../ai-elements/conversation"
import {
  Message as MessageBubble,
  MessageContent,
  MessageResponse,
} from "../ai-elements/message"
import { Task, TaskContent, TaskItem, TaskTrigger } from "../ai-elements/task"
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "../ai-elements/chain-of-thought"
import { Spinner } from "../ui/spinner"
import { cn } from "../../lib/utils"

export type MessageTimelineEventRenderer = (event: MessageTimelineEvent) => React.ReactNode

type MessageBoxProps = {
  messages: Message[]
  eventRenderers?: MessageTimelineEventRenderer[]
  className?: string
  contentClassName?: string
}

function formatEventTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function renderEventContent(
  event: MessageTimelineEvent,
  eventRenderers: MessageTimelineEventRenderer[]
) {
  for (const renderEvent of eventRenderers) {
    const rendered = renderEvent(event)
    if (rendered) {
      return rendered
    }
  }

  return null
}

function MessageStatus({ message }: { message: Message }) {
  const statusHistory = message.statusHistory ?? []
  const statusLabel = message.status ?? "Idle"
  const indicator = message.isWorking ? (
    <Spinner className="size-3" aria-hidden="true" />
  ) : (
    <span className="size-2 rounded-full bg-muted-foreground/60" aria-hidden="true" />
  )

  if (statusHistory.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {indicator}
        <span className="truncate">{statusLabel}</span>
      </div>
    )
  }

  return (
    <Task defaultOpen={false}>
      <TaskTrigger title={statusLabel}>
        <div className="flex w-full cursor-pointer items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
          {indicator}
          <span className="truncate">{statusLabel}</span>
          <span className="text-[11px]">({statusHistory.length})</span>
        </div>
      </TaskTrigger>
      <TaskContent>
        {statusHistory.map((statusItem) => (
          <TaskItem key={statusItem.id} className="flex items-center gap-3 text-xs">
            <span className="font-mono opacity-80">{formatEventTime(statusItem.at)}</span>
            <span>{statusItem.label}</span>
          </TaskItem>
        ))}
      </TaskContent>
    </Task>
  )
}

function MessageEventTimeline({
  events,
  eventRenderers,
  isWorking,
}: {
  events: MessageTimelineEvent[]
  eventRenderers: MessageTimelineEventRenderer[]
  isWorking: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(isWorking)
  const wasWorking = React.useRef(isWorking)
  const renderedEvents = events.flatMap((event) => {
    const content = renderEventContent(event, eventRenderers)
    return content ? [{ event, content }] : []
  })

  React.useEffect(() => {
    if (isWorking) {
      setIsOpen(true)
    } else if (wasWorking.current) {
      setIsOpen(false)
    }
    wasWorking.current = isWorking
  }, [isWorking])

  if (renderedEvents.length === 0) {
    return null
  }

  return (
    <ChainOfThought open={isOpen} onOpenChange={setIsOpen}>
      <ChainOfThoughtHeader>Event Timeline ({renderedEvents.length})</ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {renderedEvents.map(({ event, content }) => (
          <ChainOfThoughtStep
            key={event.id}
            label={event.summary}
            description={formatEventTime(event.at)}
          >
            <div className="min-w-0">{content}</div>
          </ChainOfThoughtStep>
        ))}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}

function MessageBox({ messages, eventRenderers = [], className, contentClassName }: MessageBoxProps) {
  // Fills its parent by default — the parent decides the height. Box styling
  // (border, background, fixed height) is left to `className`.
  return (
    <Conversation
      className={cn("size-full min-h-0 bg-transparent", className)}
    >
      <ConversationContent className={cn("gap-3 p-3", contentClassName)}>
        {messages.length === 0 ? (
          <ConversationEmptyState
            icon={<MessageSquareIcon className="size-10" aria-hidden="true" />}
            title="No messages yet"
            description="Send a task to the agent to get started"
          />
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user"
            const timelineEvents = message.events ?? []

            if (isUser) {
              if (message.text.trim().length === 0) {
                return null
              }

              return (
                <MessageBubble from="user" key={message.id}>
                  <MessageContent>
                    <MessageResponse>{message.text}</MessageResponse>
                  </MessageContent>
                </MessageBubble>
              )
            }

            return (
              <MessageBubble from="assistant" key={message.id}>
                <MessageStatus message={message} />
                {timelineEvents.length > 0 ? (
                  <MessageEventTimeline
                    events={timelineEvents}
                    eventRenderers={eventRenderers}
                    isWorking={message.isWorking === true}
                  />
                ) : null}
                {message.text.trim().length > 0 ? (
                  <MessageContent>
                    <MessageResponse>{message.text}</MessageResponse>
                  </MessageContent>
                ) : null}
              </MessageBubble>
            )
          })
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}

export { MessageBox }
