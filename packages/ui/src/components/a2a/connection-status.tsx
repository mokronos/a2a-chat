"use client"

import type { A2AChat } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import { cn } from "../../lib/utils"

export type A2AConnectionStatusProps = { controller?: A2AChat; className?: string; showAgentName?: boolean }
function ProviderStatus(props: Omit<A2AConnectionStatusProps, "controller">) { return <Status {...props} controller={useA2AChat()} /> }
function Status({ controller, className, showAgentName = true }: A2AConnectionStatusProps) {
  const connection = controller!.connection
  const name = connection.kind === "connected" ? connection.card.name : undefined
  const label = connection.kind === "failed" ? connection.error.message : connection.kind
  return <div className={cn("a2a-connection-status", className)} data-state={connection.kind} role="status" aria-live="polite"><span>{label}</span>{showAgentName && name ? <small>{name}</small> : null}</div>
}
export function A2AConnectionStatus(props: A2AConnectionStatusProps) { return props.controller ? <Status {...props} /> : <ProviderStatus {...props} /> }
