import React from "react"
import { MicIcon, PaperclipIcon, XIcon } from "lucide-react"

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "../ai-elements/prompt-input"
import { cn } from "../../lib/utils"

type InputBoxProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (message?: PromptInputMessage) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  submitLabel?: string
}

function AttachmentList() {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {attachments.files.map((file) => (
        <div
          key={file.id}
          className="flex max-w-56 items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
        >
          <PaperclipIcon className="size-3" aria-hidden="true" />
          <span className="truncate">{file.filename ?? "Attachment"}</span>
          <button
            type="button"
            className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => attachments.remove(file.id)}
            aria-label={`Remove ${file.filename ?? "attachment"}`}
          >
            <XIcon className="size-3" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}

function InputBox({
  value,
  onChange,
  onSubmit,
  disabled = false,
  className,
  placeholder = "Ask anything",
  submitLabel = "Send message",
}: InputBoxProps) {
  const canSubmit = !disabled && value.trim().length > 0

  return (
    <PromptInput
      className={cn("rounded-[2rem] border-border bg-muted/60 shadow-sm", className)}
      multiple
      onSubmit={(message) => {
        if (!disabled && message.text.trim().length > 0) {
          onSubmit(message)
        }
      }}
    >
      <AttachmentList />
      <PromptInputBody>
        <PromptInputTextarea
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          disabled={disabled}
          className="min-h-14 px-4 py-4 text-base"
        />
      </PromptInputBody>
      <PromptInputFooter className="px-3 pb-3">
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger tooltip="Attach files" disabled={disabled}>
              <PaperclipIcon className="size-4" />
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton tooltip="Voice input" disabled={disabled} aria-label="Voice input">
            <MicIcon className="size-4" />
          </PromptInputButton>
        </PromptInputTools>
        <PromptInputSubmit disabled={!canSubmit} aria-label={submitLabel} />
      </PromptInputFooter>
    </PromptInput>
  )
}

export { InputBox }
