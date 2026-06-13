import React from "react"

import { useA2AChat } from "../../a2a/context"
import { InputBox } from "../shared/input-box"
import type { PromptInputMessage } from "../ai-elements/prompt-input"

export type A2AInputProps = {
  className?: string
  placeholder?: string
}

/** Task input box with submit/cancel, wired to the provider. */
export function A2AInput({ className, placeholder = "Ask anything" }: A2AInputProps) {
  const { taskInput, setTaskInput, handleSubmitTask, handleCancelTask, isSending, connectionState } =
    useA2AChat()

  const submit = React.useCallback(
    (message?: PromptInputMessage) => {
      const files = message?.files ?? []
      const baseText = message?.text ?? taskInput
      const fileSummary = files
        .map((file) => file.filename)
        .filter((filename): filename is string => typeof filename === "string" && filename.length > 0)
        .join(", ")
      const taskText =
        fileSummary.length > 0 ? `${baseText}\n\nAttached files: ${fileSummary}` : baseText

      handleSubmitTask(taskText)
    },
    [handleSubmitTask, taskInput]
  )

  return (
    <InputBox
      value={taskInput}
      onChange={setTaskInput}
      onSubmit={submit}
      disabled={connectionState !== "connected"}
      isSending={isSending}
      onCancel={handleCancelTask}
      placeholder={placeholder}
      className={className}
    />
  )
}
