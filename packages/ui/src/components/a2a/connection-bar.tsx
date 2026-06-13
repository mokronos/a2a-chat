import React from "react"

import { A2AConnectionForm } from "./connection-form"
import type { A2AAgentSuggestion } from "./connection-form"
import { A2AConnectionStatus } from "./connection-status"
import { cn } from "../../lib/utils"

export type A2AConnectionBarProps = {
  className?: string
  agentSuggestions?: A2AAgentSuggestion[]
  /** Stack form over status ("vertical", e.g. in a sidebar) or inline them ("horizontal"). */
  orientation?: "horizontal" | "vertical"
}

/** Connection form + status, paired. The common arrangement in one component. */
export function A2AConnectionBar({
  className,
  agentSuggestions,
  orientation = "horizontal",
}: A2AConnectionBarProps) {
  const isVertical = orientation === "vertical"

  return (
    <div className={cn("flex gap-2", isVertical ? "flex-col" : "items-center", className)}>
      <A2AConnectionForm
        agentSuggestions={agentSuggestions}
        className={isVertical ? undefined : "min-w-0 flex-1"}
      />
      <A2AConnectionStatus />
    </div>
  )
}
