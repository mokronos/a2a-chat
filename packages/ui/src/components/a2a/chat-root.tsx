"use client"

import type { HTMLAttributes } from "react"
import { cn } from "../../lib/utils"

export type A2AChatRootProps = HTMLAttributes<HTMLDivElement>

/** Required scoped styling boundary when composing primitives without A2AChat. */
export function A2AChatRoot({ className, ...props }: A2AChatRootProps) {
  return <div data-a2a-chat="" className={cn("a2a-chat", className)} {...props} />
}
