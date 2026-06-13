import React from "react"

import { useA2AChat } from "../../a2a/context"
import { Suggestion, Suggestions } from "../ai-elements/suggestion"

export type A2APromptSuggestionsProps = {
  className?: string
  children: React.ReactNode
}

/** Container for a row of prompt suggestion chips. */
export function A2APromptSuggestions({ className, children }: A2APromptSuggestionsProps) {
  return <Suggestions className={className}>{children}</Suggestions>
}

export type A2APromptSuggestionProps = {
  /** Text dropped into (or submitted to) the input when clicked. */
  prompt: string
  /** Submit immediately instead of just filling the input. Default: false. */
  submit?: boolean
  className?: string
  children?: React.ReactNode
}

/** A single clickable prompt suggestion. Fills the input, or submits when `submit`. */
export function A2APromptSuggestion({
  prompt,
  submit = false,
  className,
  children,
}: A2APromptSuggestionProps) {
  const { setTaskInput, handleSubmitTask } = useA2AChat()

  return (
    <Suggestion
      suggestion={prompt}
      className={className}
      onClick={() => {
        if (submit) {
          handleSubmitTask(prompt)
        } else {
          setTaskInput(prompt)
        }
      }}
    >
      {children ?? prompt}
    </Suggestion>
  )
}
