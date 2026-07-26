"use client"

import * as React from "react"
import type { A2AChat, ConnectionTarget } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import { cn } from "../../lib/utils"

export type A2AAgentSuggestion = {
  id: string
  label: string
  target: ConnectionTarget
  description?: string
}

export type A2AConnectionFormProps = {
  controller?: A2AChat
  configuredTarget?: ConnectionTarget
  allowDirectUrl?: boolean
  className?: string
  placeholder?: string
  agentSuggestions?: readonly A2AAgentSuggestion[]
}

type TargetChoice = { id: string; label: string; description?: string; target: ConnectionTarget }
const CUSTOM_DIRECT = "__custom-direct__"
const CONFIGURED_TARGET = "__configured-target__"
const CURRENT_TARGET = "__current-target__"

function sameTarget(left: ConnectionTarget, right: ConnectionTarget): boolean {
  if (left.kind !== right.kind) return false
  if (left.kind === "direct" && right.kind === "direct") return left.baseUrl === right.baseUrl
  if (left.kind === "proxy" && right.kind === "proxy") {
    return left.targetId === right.targetId && left.basePath === right.basePath
  }
  return left.kind === "client" && right.kind === "client" && left.client === right.client
}

export function connectionTargetDescription(target: ConnectionTarget): string {
  if (target.kind === "direct") return target.baseUrl
  if (target.kind === "proxy") return `Proxy target: ${target.targetId}${target.basePath ? ` via ${target.basePath}` : ""}`
  return target.card?.name ? `Provided client: ${target.card.name}` : "Provided A2A client"
}

export function connectionTargetChoices(input: {
  suggestions: readonly A2AAgentSuggestion[]
  configuredTarget?: ConnectionTarget
  currentTarget?: ConnectionTarget
}): TargetChoice[] {
  const choices = input.suggestions.map((suggestion) => ({ ...suggestion }))
  if (input.configuredTarget && !choices.some((choice) => sameTarget(choice.target, input.configuredTarget!))) {
    choices.unshift({
      id: CONFIGURED_TARGET,
      label: "Configured target",
      description: connectionTargetDescription(input.configuredTarget),
      target: input.configuredTarget,
    })
  }
  if (input.currentTarget && !choices.some((choice) => sameTarget(choice.target, input.currentTarget!))) {
    choices.unshift({
      id: CURRENT_TARGET,
      label: "Current target",
      description: connectionTargetDescription(input.currentTarget),
      target: input.currentTarget,
    })
  }
  return choices
}

export function resolveConnectionTarget(
  selection: string,
  directUrl: string,
  choices: readonly TargetChoice[],
): ConnectionTarget | undefined {
  if (selection === CUSTOM_DIRECT) {
    return directUrl ? { kind: "direct", baseUrl: directUrl } : undefined
  }
  return choices.find((choice) => choice.id === selection)?.target
}

function ProviderForm(props: Omit<A2AConnectionFormProps, "controller">) {
  return <Form {...props} controller={useA2AChat()} />
}

function Form({
  controller,
  configuredTarget,
  allowDirectUrl = true,
  className,
  placeholder = "https://agent.example",
  agentSuggestions = [],
}: A2AConnectionFormProps) {
  const selectId = React.useId()
  const directId = React.useId()
  const currentTarget = controller!.connection.kind === "disconnected"
    ? undefined
    : controller!.connection.target
  const initialTarget = currentTarget ?? configuredTarget
  const choices = React.useMemo(
    () => connectionTargetChoices({ suggestions: agentSuggestions, configuredTarget, currentTarget }),
    [agentSuggestions, configuredTarget, currentTarget],
  )
  const matching = initialTarget
    ? choices.find((choice) => sameTarget(choice.target, initialTarget))
    : undefined
  const initialCustomDirect = allowDirectUrl && initialTarget?.kind === "direct"
  const [selection, setSelection] = React.useState(
    initialCustomDirect ? CUSTOM_DIRECT : matching?.id ?? choices[0]?.id ?? (allowDirectUrl ? CUSTOM_DIRECT : ""),
  )
  const [url, setUrl] = React.useState(initialTarget?.kind === "direct" ? initialTarget.baseUrl : "")
  const [error, setError] = React.useState<string>()
  const edited = React.useRef(false)
  const selectedChoice = choices.find((choice) => choice.id === selection)
  const target = resolveConnectionTarget(selection, url, choices)

  React.useEffect(() => {
    if (!currentTarget || edited.current) return
    const next = choices.find((choice) => sameTarget(choice.target, currentTarget))
    if (allowDirectUrl && currentTarget.kind === "direct") {
      setSelection(CUSTOM_DIRECT)
      setUrl(currentTarget.baseUrl)
    } else if (next) {
      setSelection(next.id)
    }
  }, [allowDirectUrl, choices, currentTarget])

  return (
    <form
      className={cn("a2a-connection-form", className)}
      onSubmit={(event) => {
        event.preventDefault()
        if (!target) return
        setError(undefined)
        void controller!.connect(target).catch((cause) => setError(cause instanceof Error ? cause.message : "Connection failed"))
      }}
    >
      {(choices.length > 0 || allowDirectUrl) ? (
        <label htmlFor={selectId}>
          <span className="sr-only">Connection target</span>
          <select id={selectId} value={selection} onChange={(event) => { edited.current = true; setSelection(event.target.value) }}>
            {choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label} ({choice.target.kind})</option>)}
            {allowDirectUrl ? <option value={CUSTOM_DIRECT}>Custom direct URL</option> : null}
          </select>
        </label>
      ) : null}
      {selection === CUSTOM_DIRECT ? (
        <label htmlFor={directId}>
          <span className="sr-only">A2A agent URL</span>
          <input id={directId} value={url} onChange={(event) => { edited.current = true; setUrl(event.target.value) }} placeholder={placeholder} type="url" required />
        </label>
      ) : selectedChoice ? <p className="a2a-target-description">{selectedChoice.description ?? connectionTargetDescription(selectedChoice.target)}</p> : <p className="a2a-target-description">No connection target configured.</p>}
      <button type="submit" disabled={!target || controller!.connection.kind === "connecting"}>{controller!.connection.kind === "connecting" ? "Connecting" : "Connect"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  )
}

export function A2AConnectionForm(props: A2AConnectionFormProps) {
  return props.controller ? <Form {...props} /> : <ProviderForm {...props} />
}
