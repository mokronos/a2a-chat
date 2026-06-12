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
  isSending?: boolean
  onCancel?: () => void
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
  isSending = false,
  onCancel,
  className,
  placeholder = "Ask anything",
  submitLabel = "Send message",
}: InputBoxProps) {
  const canSubmit = !disabled && value.trim().length > 0

  return (
    <PromptInput
      className={cn("min-h-32 rounded-3xl border-border bg-muted/70 shadow-sm", className)}
      multiple
      onSubmit={(message) => {
        if (!disabled && !isSending && message.text.trim().length > 0) {
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
          disabled={disabled || isSending}
          className="min-h-16 px-5 py-5 text-base"
        />
      </PromptInputBody>
      <PromptInputFooter className="px-4 pb-4">
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger tooltip="Attach files" disabled={disabled || isSending}>
              <PaperclipIcon className="size-4" />
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton tooltip="Voice input" disabled={disabled || isSending} aria-label="Voice input">
            <MicIcon className="size-4" />
          </PromptInputButton>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={isSending ? false : !canSubmit}
          status={isSending ? "streaming" : undefined}
          onStop={onCancel}
          aria-label={isSending ? "Cancel task" : submitLabel}
        />
      </PromptInputFooter>
    </PromptInput>
  )
}

export { InputBox }
