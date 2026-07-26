"use client"

import * as React from "react"
import type { A2AChat, ConversationId, TurnId } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import { A2AForm, createFormResponseParts, type FormSpec } from "./a2a-form"

export type A2AInputRequestProps = { conversationId: ConversationId; turnId: TurnId; spec: FormSpec; controller?: A2AChat }
function ProviderRequest(props: Omit<A2AInputRequestProps, "controller">) { return <Request {...props} controller={useA2AChat()} /> }
function Request({ conversationId, turnId, spec, controller }: A2AInputRequestProps) {
  const [error, setError] = React.useState<string>()
  return <A2AForm spec={spec} error={error} onSubmit={async (values) => {
    setError(undefined)
    try { await controller!.respondToInput({ conversationId, turnId, parts: createFormResponseParts(spec, values) }) }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The form response could not be sent."); throw cause }
  }} />
}
export function A2AInputRequest(props: A2AInputRequestProps) { return props.controller ? <Request {...props} /> : <ProviderRequest {...props} /> }
