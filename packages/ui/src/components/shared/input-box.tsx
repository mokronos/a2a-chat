import React from "react"
import { ArrowUpIcon } from "lucide-react"

import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

type InputBoxProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

function InputBox({ value, onChange, onSubmit, disabled = false }: InputBoxProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Textarea
        placeholder="Write a message..."
        className="min-h-20 flex-1 resize-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <Button
        variant="outline"
        size="icon"
        disabled={disabled || value.trim().length === 0}
        aria-label="Send message"
        onClick={onSubmit}
      >
        <ArrowUpIcon />
      </Button>
    </div>
  )
}

export { InputBox }
