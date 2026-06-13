import React from "react"

import { useA2AChat } from "../../a2a/context"
import { cn } from "../../lib/utils"
import type { ConnectionState } from "../../a2a/types"

export type A2AConnectionStatusProps = {
  className?: string
  /** Show the connected agent's name next to the status badge. Default: true. */
  showAgentName?: boolean
}

function getStatusClasses(state: ConnectionState) {
  if (state === "connected") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
  }

  if (state === "connecting") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700"
  }

  if (state === "error") {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }

  return "border-border bg-muted text-muted-foreground"
}

/** Connection status badge (+ optional agent name), driven by the provider. */
export function A2AConnectionStatus({ className, showAgentName = true }: A2AConnectionStatusProps) {
  const { connectionState, connectionMessage, agentName } = useA2AChat()

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
          getStatusClasses(connectionState)
        )}
      >
        {connectionMessage}
      </div>
      {showAgentName && agentName ? (
        <div className="text-xs text-muted-foreground">Agent: {agentName}</div>
      ) : null}
    </div>
  )
}
