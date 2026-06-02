import React from "react"

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input"

type InputBoxProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

function InputBox({ value, onChange, onSubmit, disabled = false }: InputBoxProps) {
  const canSubmit = !disabled && value.trim().length > 0

  return (
    <PromptInput
      onSubmit={() => {
        if (canSubmit) {
          onSubmit()
        }
      }}
    >
      <PromptInputBody>
        <PromptInputTextarea
          placeholder="Write a message..."
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          disabled={disabled}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit disabled={!canSubmit} aria-label="Send message" />
      </PromptInputFooter>
    </PromptInput>
  )
}

export { InputBox }
