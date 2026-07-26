"use client"

import type { A2AChat, ConversationId } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import type { ReactNode } from "react"
export type A2AEmptyStateProps = { conversationId: ConversationId; controller?: A2AChat; children: ReactNode; className?: string }
function ProviderEmpty(props: Omit<A2AEmptyStateProps, "controller">) { return <Empty {...props} controller={useA2AChat()} /> }
function Empty({ conversationId, controller, children, className }: A2AEmptyStateProps) { return controller!.getConversation(conversationId)?.turns.length ? null : <div className={className}>{children}</div> }
export function A2AEmptyState(props: A2AEmptyStateProps) { return props.controller ? <Empty {...props} /> : <ProviderEmpty {...props} /> }
