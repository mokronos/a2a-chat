"use client"

import * as React from "react"
import type { A2AChat, ConversationId } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"
import { cn } from "../../lib/utils"

export type ConversationListProps = {
  activeConversationId?: ConversationId
  onConversationChange: (id: ConversationId) => void
  controller?: A2AChat
  className?: string
  showSearch?: boolean
}

function conversationTitle(index: number, conversation: A2AChat["conversations"][number]): string {
  const firstText = conversation.turns[0]?.request.parts.find((part) => part.kind === "text")
  return firstText?.text.trim() || `Conversation ${index + 1}`
}

function ProviderList(props: Omit<ConversationListProps, "controller">) {
  return <List {...props} controller={useA2AChat()} />
}

function List({ controller, activeConversationId, onConversationChange, className, showSearch = true }: ConversationListProps) {
  const [search, setSearch] = React.useState("")
  const items = controller!.conversations
    .map((conversation, index) => ({ conversation, title: conversationTitle(index, conversation) }))
    .filter(({ title }) => title.toLowerCase().includes(search.trim().toLowerCase()))
  return (
    <div className={cn("a2a-conversations", className)}>
      <div className="a2a-list-heading"><strong>Conversations</strong><button type="button" onClick={() => onConversationChange(controller!.createConversation().id)}><PlusIcon /><span>New</span></button></div>
      {showSearch ? <label className="a2a-search"><SearchIcon aria-hidden="true" /><span className="sr-only">Search conversations</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" /></label> : null}
      <div className="a2a-conversation-items">
        {items.map(({ conversation, title }) => (
          <div className="a2a-conversation" data-active={conversation.id === activeConversationId} key={conversation.id}>
            <button type="button" aria-current={conversation.id === activeConversationId ? "page" : undefined} onClick={() => onConversationChange(conversation.id)}><span>{title}</span><small>{conversation.turns.length} turns</small></button>
            <button type="button" aria-label={`Delete ${title}`} onClick={async () => { await controller!.deleteConversation(conversation.id) }}><Trash2Icon /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ConversationList(props: ConversationListProps) {
  return props.controller ? <List {...props} /> : <ProviderList {...props} />
}
