"use client"

import * as React from "react"
import type { A2AChat } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import { cn } from "../../lib/utils"

export type A2AConnectionAuthProps = {
  controller?: A2AChat
  className?: string
  /** Render even when the agent never asked for a credential. */
  alwaysVisible?: boolean
}

const STATUS_MESSAGE = {
  required: "This agent requires a credential.",
  rejected: "The agent rejected this credential.",
  accepted: "Credential accepted.",
  provided: "Credential stored for this session.",
  "not-required": "This agent did not ask for a credential.",
} as const

function ProviderAuth(props: Omit<A2AConnectionAuthProps, "controller">) {
  return <Auth {...props} controller={useA2AChat()} />
}

function Auth({ controller, className, alwaysVisible = false }: A2AConnectionAuthProps) {
  const { auth, setCredential } = controller!
  const inputId = React.useId()
  const [value, setValue] = React.useState("")

  const visible = alwaysVisible || auth.status !== "not-required" || auth.hasCredential
  if (!visible) return null

  const label = auth.requirement?.kind === "apiKey" ? `API key (${auth.requirement.header})` : "Bearer token"
  const failed = auth.status === "rejected"

  return (
    <form
      className={cn("a2a-connection-auth", className)}
      data-status={auth.status}
      onSubmit={(event) => {
        event.preventDefault()
        setCredential(value)
        setValue("")
      }}
    >
      <label htmlFor={inputId}>
        <span className="sr-only">{label}</span>
        <input
          id={inputId}
          type="password"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={auth.hasCredential ? "Replace credential" : label}
          aria-invalid={failed || undefined}
        />
      </label>
      <button type="submit" disabled={!value.trim()}>
        Save
      </button>
      {auth.hasCredential ? (
        <button type="button" onClick={() => controller!.clearCredential()}>
          Clear
        </button>
      ) : null}
      <p role={failed ? "alert" : "status"}>
        {STATUS_MESSAGE[auth.status]}
        {auth.requirement?.description ? ` ${auth.requirement.description}` : null}
      </p>
    </form>
  )
}

/** Collects the secret an agent's card asks for and hands it to the runtime. */
export function A2AConnectionAuth(props: A2AConnectionAuthProps) {
  return props.controller ? <Auth {...props} /> : <ProviderAuth {...props} />
}
