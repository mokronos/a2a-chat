"use client"

import type { A2AChat, ConversationId } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

export function A2APromptSuggestions({ children, className }: { children: ReactNode; className?: string }) { return <div className={cn("a2a-suggestions", className)}>{children}</div> }
export type A2APromptSuggestionProps = { conversationId: ConversationId; prompt: string; controller?: A2AChat; className?: string; children?: ReactNode }
function ProviderSuggestion(props: Omit<A2APromptSuggestionProps, "controller">) { return <Suggestion {...props} controller={useA2AChat()} /> }
function Suggestion({ conversationId, prompt, controller, className, children }: A2APromptSuggestionProps) { return <button type="button" className={className} disabled={controller!.connection.kind !== "connected"} onClick={() => { void controller!.sendText({ conversationId, text: prompt }) }}>{children ?? prompt}</button> }
export function A2APromptSuggestion(props: A2APromptSuggestionProps) { return props.controller ? <Suggestion {...props} /> : <ProviderSuggestion {...props} /> }
