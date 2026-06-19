import React from "react"

import { useA2AChat } from "@mokronos/a2a-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"

export type A2AAgentSuggestion = {
  label: string
  url: string
  description?: string
}

export type A2AConnectionFormProps = {
  className?: string
  placeholder?: string
  /** Optional autocomplete entries shown as a datalist on the URL input. */
  agentSuggestions?: A2AAgentSuggestion[]
}

const SUGGESTIONS_LIST_ID = "a2a-agent-suggestions"

/** URL input + connect button, wired to the provider's connection state. */
export function A2AConnectionForm({
  className,
  placeholder = "http://localhost:8000",
  agentSuggestions = [],
}: A2AConnectionFormProps) {
  const { url, setUrl, handleConnect, connectionState } = useA2AChat()
  const hasSuggestions = agentSuggestions.length > 0

  return (
    <form
      className={cn("grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]", className)}
      onSubmit={(event) => {
        event.preventDefault()
        handleConnect()
      }}
    >
      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={placeholder}
        aria-label="A2A server URL"
        list={hasSuggestions ? SUGGESTIONS_LIST_ID : undefined}
      />
      {hasSuggestions ? (
        <datalist id={SUGGESTIONS_LIST_ID}>
          {agentSuggestions.map((suggestion) => (
            <option
              key={suggestion.url}
              value={suggestion.url}
              label={
                suggestion.description
                  ? `${suggestion.label} - ${suggestion.description}`
                  : suggestion.label
              }
            />
          ))}
        </datalist>
      ) : null}
      <Button type="submit" variant="outline" disabled={connectionState === "connecting"} className="h-9">
        {connectionState === "connecting" ? "Connecting..." : "Connect"}
      </Button>
    </form>
  )
}
