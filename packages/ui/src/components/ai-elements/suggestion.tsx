import React from "react"

import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

type SuggestionsProps = React.HTMLAttributes<HTMLDivElement>

function Suggestions({ className, ...props }: SuggestionsProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      {...props}
    />
  )
}

type SuggestionProps = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string
  onClick?: (suggestion: string) => void
}

function Suggestion({ className, suggestion, onClick, children, ...props }: SuggestionProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn("rounded-full bg-background/80 px-4 text-sm", className)}
      onClick={() => onClick?.(suggestion)}
      {...props}
    >
      {children ?? suggestion}
    </Button>
  )
}

export { Suggestion, Suggestions }
