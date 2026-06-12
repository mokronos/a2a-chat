import React from "react"
import { MessageSquareIcon } from "lucide-react"

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
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning"
import { Task, TaskContent, TaskItem, TaskTrigger } from "../ai-elements/task"
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "../ai-elements/chain-of-thought"
import { CodeBlock } from "../ai-elements/code-block"
import { Spinner } from "../ui/spinner"
import { cn } from "../../lib/utils"

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
  rawEvent?: unknown
  at: number
}

export type MessageTimelineEventRenderer = (event: MessageTimelineEvent) => React.ReactNode

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
  eventRenderers?: MessageTimelineEventRenderer[]
  className?: string
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
}: {
  events: MessageTimelineEvent[]
  eventRenderers: MessageTimelineEventRenderer[]
}) {
  return (
    <ChainOfThought defaultOpen={false}>
      <ChainOfThoughtHeader>Event Timeline ({events.length})</ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {events.map((eventItem) => {
          const customContent = renderEventContent(eventItem, eventRenderers)

          return (
            <ChainOfThoughtStep
              key={eventItem.id}
              label={`${eventItem.kind}: ${eventItem.summary}`}
              description={
                eventItem.details
                  ? `${formatEventTime(eventItem.at)} — ${eventItem.details}`
                  : formatEventTime(eventItem.at)
              }
            >
              {customContent ? (
                <div className="min-w-0">{customContent}</div>
              ) : eventItem.raw ? (
                <CodeBlock code={eventItem.raw} language="json" className="text-[10px]" />
              ) : null}
            </ChainOfThoughtStep>
          )
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}

function MessageBox({ messages, eventRenderers = [], className }: MessageBoxProps) {
  return (
    <Conversation
      className={cn("h-72 rounded-md border border-border bg-background", className)}
    >
      <ConversationContent className="gap-3 p-3">
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
                  />
                ) : null}
                {message.thinkingText && message.thinkingText.trim().length > 0 ? (
                  <Reasoning className="w-full" isStreaming={message.isWorking === true}>
                    <ReasoningTrigger />
                    <ReasoningContent>{message.thinkingText}</ReasoningContent>
                  </Reasoning>
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
