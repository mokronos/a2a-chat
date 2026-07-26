"use client"

import { memo, type ComponentProps } from "react"
import { Streamdown } from "streamdown"
import { cn } from "../../lib/utils"

export type ResponseProps = ComponentProps<typeof Streamdown>
export const Response = memo(function Response({ className, ...props }: ResponseProps) {
  return <Streamdown className={cn("a2a-markdown", className)} {...props} />
})
