import React from "react"
import { CircleHelpIcon, LockIcon } from "lucide-react"

import { useA2AChat } from "@mokronos/a2a-react"
import type { InputRequest } from "@mokronos/a2a-react"
import { A2AForm } from "./a2a-form"
import { MessageResponse } from "../ai-elements/message"
import { cn } from "../../lib/utils"

export type A2AInputRequestProps = {
  /** The assistant message that carries the request (used to correlate the reply). */
  messageId: string
  request: InputRequest
  className?: string
}

/**
 * Renders an agent's request for user input. When the request carries a
 * {@link FormSpec} it renders a form and submits structured values back to the
 * task; otherwise it shows the prompt and the user replies through the normal
 * input box (which is already wired to the same task/context).
 */
export function A2AInputRequest({ messageId, request, className }: A2AInputRequestProps) {
  const { handleSubmitInputResponse } = useA2AChat()
  const Icon = request.reason === "auth-required" ? LockIcon : CircleHelpIcon

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {request.text ? (
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <MessageResponse className="text-sm">{request.text}</MessageResponse>
        </div>
      ) : null}

      {request.form ? (
        <A2AForm
          spec={request.form}
          disabled={!request.pending}
          onSubmit={(values) => handleSubmitInputResponse({ messageId, request, values })}
        />
      ) : request.pending ? (
        <p className="text-xs text-muted-foreground">Reply below to continue.</p>
      ) : null}
    </div>
  )
}
