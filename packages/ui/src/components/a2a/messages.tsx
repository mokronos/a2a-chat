import React from "react"

import { useA2AChat } from "@mokronos/a2a-react"
import { MessageBox } from "../shared/message-box"
import type { MessageTimelineEventRenderer } from "../shared/message-box"
import { defaultPartRenderers } from "./part-renderers"
import type { A2APartRenderer } from "./part-renderers"
import { inspectorEventRenderers } from "./inspector-event-renderers"
import { cn } from "../../lib/utils"

export type A2AMessagesMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "none"

const MAX_WIDTH_CLASS: Record<A2AMessagesMaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  none: "",
}

export type A2AMessagesProps = {
  className?: string
  /** Classes applied to the inner content (the centered message column). */
  contentClassName?: string
  /**
   * Center the conversation content at this width while the scroll area stays
   * full-bleed (ChatGPT-style). Default: "none" (content spans the full width).
   */
  maxWidth?: A2AMessagesMaxWidth
  /** Renderers for timeline events. Defaults to the built-in inspector renderers. */
  eventRenderers?: MessageTimelineEventRenderer[]
  /** Renderers for output content parts (images, files, data). Prepend your own for custom data. */
  partRenderers?: A2APartRenderer[]
}

/** The message timeline for the active task session. Fills its parent. */
export function A2AMessages({
  className,
  contentClassName,
  maxWidth = "none",
  eventRenderers = inspectorEventRenderers,
  partRenderers = defaultPartRenderers,
}: A2AMessagesProps) {
  const { messages } = useA2AChat()
  const widthClass = MAX_WIDTH_CLASS[maxWidth]

  return (
    <MessageBox
      messages={messages}
      eventRenderers={eventRenderers}
      partRenderers={partRenderers}
      className={className}
      contentClassName={cn(widthClass && `${widthClass} mx-auto w-full`, contentClassName)}
    />
  )
}
