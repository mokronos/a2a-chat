"use client"

import type { A2AChat, ConversationId } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import { MessageBox } from "../shared/message-box"
import type { EventRenderer, FileUriResolver, PartRenderer } from "./renderers"
import { cn } from "../../lib/utils"

export type A2AMessagesMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "none"
const WIDTH: Record<A2AMessagesMaxWidth, string> = {
  sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", "2xl": "max-w-2xl",
  "3xl": "max-w-3xl", "4xl": "max-w-4xl", "5xl": "max-w-5xl", none: "",
}

export type A2AMessagesProps = {
  conversationId: ConversationId
  controller?: A2AChat
  className?: string
  contentClassName?: string
  maxWidth?: A2AMessagesMaxWidth
  eventRenderers?: readonly EventRenderer[]
  partRenderers?: readonly PartRenderer[]
  fileUriResolver?: FileUriResolver
}

function ProviderMessages(props: Omit<A2AMessagesProps, "controller">) {
  return <Messages {...props} controller={useA2AChat()} />
}

function Messages({ conversationId, controller, className, contentClassName, maxWidth = "none", eventRenderers, partRenderers, fileUriResolver }: A2AMessagesProps) {
  const conversation = controller!.getConversation(conversationId)
  if (!conversation) return null
  return (
    <MessageBox
      conversation={conversation}
      eventRenderers={eventRenderers}
      partRenderers={partRenderers}
      fileUriResolver={fileUriResolver}
      className={className}
      contentClassName={cn(WIDTH[maxWidth], WIDTH[maxWidth] && "mx-auto w-full", contentClassName)}
    />
  )
}

export function A2AMessages(props: A2AMessagesProps) {
  return props.controller ? <Messages {...props} /> : <ProviderMessages {...props} />
}
