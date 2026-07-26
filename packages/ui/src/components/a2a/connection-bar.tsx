"use client"

import { A2AConnectionForm } from "./connection-form"
import type { A2AAgentSuggestion } from "./connection-form"
import type { ConnectionTarget } from "@mokronos/a2a-react"
import { A2AConnectionStatus } from "./connection-status"
import { cn } from "../../lib/utils"

export type A2AConnectionBarProps = {
  className?: string
  agentSuggestions?: A2AAgentSuggestion[]
  configuredTarget?: ConnectionTarget
  allowDirectUrl?: boolean
  /** Stack form over status ("vertical", e.g. in a sidebar) or inline them ("horizontal"). */
  orientation?: "horizontal" | "vertical"
}

/** Connection form + status, paired. The common arrangement in one component. */
export function A2AConnectionBar({
  className,
  agentSuggestions,
  configuredTarget,
  allowDirectUrl,
  orientation = "horizontal",
}: A2AConnectionBarProps) {
  return (
    <div className={cn("a2a-connection-bar", className)} data-orientation={orientation}>
      <A2AConnectionForm
        agentSuggestions={agentSuggestions}
        configuredTarget={configuredTarget}
        allowDirectUrl={allowDirectUrl}
      />
      <A2AConnectionStatus />
    </div>
  )
}
