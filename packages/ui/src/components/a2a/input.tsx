"use client"

import * as React from "react"
import type { A2AChat, ConversationId } from "@mokronos/a2a-react"
import { useA2AChat } from "@mokronos/a2a-react"
import { PaperclipIcon, SendIcon, SquareIcon, XIcon } from "lucide-react"
import {
  attachmentsToParts,
  composeOutgoingParts,
  validateAttachments,
  type AttachmentAdapter,
  type AttachmentLimits,
} from "../../lib/attachments"
import { latestAwaitingInputTurn, type DataPart } from "../../lib/protocol"
import { cn } from "../../lib/utils"

export type A2AInputProps = AttachmentLimits & {
  conversationId: ConversationId
  controller?: A2AChat
  attachmentAdapter?: AttachmentAdapter
  dataParts?: readonly DataPart[]
  className?: string
  placeholder?: string
  label?: string
}

function ProviderInput(props: Omit<A2AInputProps, "controller">) {
  return <Input {...props} controller={useA2AChat()} />
}

function Input({
  conversationId,
  controller,
  attachmentAdapter,
  dataParts,
  className,
  placeholder = "Ask anything",
  label = "Message the agent",
  accept,
  maxFiles = 8,
  maxFileSize = 10 * 1024 * 1024,
  maxTotalBytes = 25 * 1024 * 1024,
}: A2AInputProps) {
  const [text, setText] = React.useState("")
  const [files, setFiles] = React.useState<File[]>([])
  const [error, setError] = React.useState<string>()
  const [preparing, setPreparing] = React.useState(false)
  const abortRef = React.useRef<AbortController>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const conversation = controller!.getConversation(conversationId)
  const activeTurn = [...(conversation?.turns ?? [])].reverse().find((turn) =>
    turn.lifecycle.kind === "running" || turn.lifecycle.kind === "recovering",
  )
  const busy = preparing || activeTurn !== undefined
  const limits = { accept, maxFiles, maxFileSize, maxTotalBytes }

  async function submit() {
    setError(undefined)
    const abortController = new AbortController()
    abortRef.current = abortController
    setPreparing(true)
    try {
      const fileParts = await attachmentsToParts({ files, adapter: attachmentAdapter, limits, signal: abortController.signal })
      const parts = composeOutgoingParts({ text, files: fileParts, dataParts })
      if (parts.length === 0) return
      const awaiting = latestAwaitingInputTurn(controller!.getConversation(conversationId))
      if (awaiting) await controller!.respondToInput({ conversationId, turnId: awaiting.id, parts })
      else await controller!.send({ conversationId, parts })
      setText("")
      setFiles([])
      requestAnimationFrame(() => textareaRef.current?.focus())
    } catch (cause) {
      if (!abortController.signal.aborted) setError(cause instanceof Error ? cause.message : "Message could not be sent.")
    } finally {
      abortRef.current = null
      setPreparing(false)
    }
  }

  return (
    <form className={cn("a2a-composer", className)} aria-label={label} onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <label className="sr-only" htmlFor={`a2a-composer-${conversationId}`}>{label}</label>
      {files.length > 0 ? <ul className="a2a-attachments">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}><span>{file.name}</span><small>{Math.ceil(file.size / 1024)} KB</small><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, candidate) => candidate !== index))}><XIcon /></button></li>)}</ul> : null}
      <textarea
        id={`a2a-composer-${conversationId}`}
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (!busy && (text.trim() || files.length || dataParts?.length)) void submit() } }}
        placeholder={placeholder}
        disabled={controller!.connection.kind !== "connected" || busy}
      />
      <div className="a2a-composer-actions">
        <label className="a2a-attach-button"><PaperclipIcon /><span className="sr-only">Attach files</span><input type="file" multiple={maxFiles !== 1} accept={accept} disabled={busy} onChange={(event) => {
          const next = [...files, ...Array.from(event.currentTarget.files ?? [])]
          event.currentTarget.value = ""
          try { validateAttachments(next, limits); setFiles(next); setError(undefined) } catch (cause) { setError(cause instanceof Error ? cause.message : "Files could not be added.") }
        }} /></label>
        {busy ? <button type="button" aria-label="Cancel current turn" onClick={() => { abortRef.current?.abort(); if (activeTurn) void controller!.cancel(activeTurn.id) }}><SquareIcon /></button> : <button type="submit" aria-label="Send message" disabled={controller!.connection.kind !== "connected" || (!text.trim() && files.length === 0 && !dataParts?.length)}><SendIcon /></button>}
      </div>
      <p className="a2a-composer-status" role="status" aria-live="polite">{error ?? (preparing ? "Preparing attachments" : activeTurn ? `Agent ${activeTurn.lifecycle.kind}` : "")}</p>
    </form>
  )
}

export function A2AInput(props: A2AInputProps) {
  return props.controller ? <Input {...props} /> : <ProviderInput {...props} />
}
