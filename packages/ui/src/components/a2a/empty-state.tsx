import React from "react"

import { useA2AChat } from "@mokronos/a2a-react"
import { cn } from "../../lib/utils"

export type A2AEmptyStateProps = {
  className?: string
  children: React.ReactNode
}

/**
 * Renders its children only while the conversation is empty (no messages yet).
 * Use it for a greeting / starter prompts — e.g. overlaid on A2AMessages, or
 * as the centered hero of a new chat.
 */
export function A2AEmptyState({ className, children }: A2AEmptyStateProps) {
  const { messages } = useA2AChat()

  if (messages.length > 0) {
    return null
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>{children}</div>
  )
}
