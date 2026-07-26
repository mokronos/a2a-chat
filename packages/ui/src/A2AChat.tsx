"use client"

import * as React from "react"
import type { A2AChatProviderProps, ConnectionTarget, ConversationId } from "@mokronos/a2a-react"
import { A2AChatProvider, useA2AChat } from "@mokronos/a2a-react"
import { ImageIcon, MenuIcon, PencilIcon, SearchIcon, XIcon } from "lucide-react"
import { ConversationList } from "./components/a2a/conversation-list"
import { A2AConnectionForm, type A2AAgentSuggestion } from "./components/a2a/connection-form"
import { A2AConnectionStatus } from "./components/a2a/connection-status"
import { A2AInput, type A2AInputProps } from "./components/a2a/input"
import { A2AMessages } from "./components/a2a/messages"
import { A2APromptSuggestion, A2APromptSuggestions } from "./components/a2a/prompt-suggestions"
import type { EventRenderer, FileUriResolver, PartRenderer } from "./components/a2a/renderers"
import { cn } from "./lib/utils"

export type A2AChatPromptSuggestion = { label: string; prompt?: string; icon?: React.ReactNode }
type ProviderOptions = Omit<A2AChatProviderProps, "children">
type ComposerOptions = Pick<A2AInputProps, "attachmentAdapter" | "accept" | "maxFiles" | "maxFileSize" | "maxTotalBytes" | "dataParts">

export type A2AChatProps = ProviderOptions & ComposerOptions & {
  className?: string
  contentClassName?: string
  messagesClassName?: string
  title?: string
  description?: string
  showConnectionForm?: boolean
  showHeader?: boolean
  showConnectionStatus?: boolean
  showConversations?: boolean
  fillHeight?: boolean
  agentSuggestions?: readonly A2AAgentSuggestion[]
  promptSuggestions?: readonly A2AChatPromptSuggestion[]
  welcomeMessage?: string
  inputPlaceholder?: string
  eventRenderers?: readonly EventRenderer[]
  partRenderers?: readonly PartRenderer[]
  fileUriResolver?: FileUriResolver
  allowDirectUrl?: boolean
}

const defaultSuggestions: readonly A2AChatPromptSuggestion[] = [
  { label: "Create an image", icon: <ImageIcon aria-hidden="true" /> },
  { label: "Write or edit", icon: <PencilIcon aria-hidden="true" /> },
  { label: "Look something up", icon: <SearchIcon aria-hidden="true" /> },
]

type ShellProps = Omit<A2AChatProps, keyof ProviderOptions> & { configuredTarget?: ConnectionTarget }

function ChatShell({
  className,
  contentClassName,
  messagesClassName,
  title = "A2A Chat",
  description = "A direct conversation with an A2A agent",
  showConnectionForm = true,
  showHeader = true,
  showConnectionStatus = true,
  showConversations = true,
  fillHeight = false,
  agentSuggestions,
  promptSuggestions = defaultSuggestions,
  welcomeMessage = "How can I help?",
  inputPlaceholder,
  eventRenderers,
  partRenderers,
  fileUriResolver,
  allowDirectUrl = true,
  attachmentAdapter,
  accept,
  maxFiles,
  maxFileSize,
  maxTotalBytes,
  dataParts,
  configuredTarget,
}: ShellProps) {
  const controller = useA2AChat()
  const [activeId, setActiveId] = React.useState<ConversationId>()
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [mobile, setMobile] = React.useState(false)
  const rootRef = React.useRef<HTMLElement>(null)
  const menuRef = React.useRef<HTMLButtonElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (activeId && controller.getConversation(activeId)) return
    setActiveId(controller.conversations.at(-1)?.id ?? controller.createConversation().id)
  }, [activeId, controller, controller.conversations])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new ResizeObserver(([entry]) => setMobile((entry?.contentRect.width ?? root.clientWidth) <= 672))
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!drawerOpen) return
    closeRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false)
        menuRef.current?.focus()
      }
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [drawerOpen])

  const selectConversation = (id: ConversationId) => {
    setActiveId(id)
    setDrawerOpen(false)
    requestAnimationFrame(() => menuRef.current?.focus())
  }
  const conversation = activeId ? controller.getConversation(activeId) : undefined
  const empty = !conversation?.turns.length

  return (
    <section ref={rootRef} data-a2a-chat="" className={cn("a2a-chat", fillHeight && "a2a-fill", className)}>
      {showHeader ? <header className="a2a-header"><div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div><div className="a2a-header-actions">{showConnectionStatus ? <A2AConnectionStatus controller={controller} /> : null}{showConversations ? <button ref={menuRef} className="a2a-drawer-toggle" type="button" aria-label="Open conversations" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><MenuIcon /></button> : null}</div>{showConnectionForm ? <A2AConnectionForm controller={controller} configuredTarget={configuredTarget} agentSuggestions={agentSuggestions} allowDirectUrl={allowDirectUrl} /> : null}</header> : null}
      <div className={cn("a2a-layout", contentClassName)}>
        {showConversations ? <><button className="a2a-drawer-backdrop" data-open={drawerOpen} type="button" aria-label="Close conversations" onClick={() => setDrawerOpen(false)} /><aside className="a2a-sidebar" data-open={drawerOpen} aria-label="Conversation navigation" inert={mobile && !drawerOpen ? true : undefined}><button ref={closeRef} className="a2a-drawer-close" type="button" aria-label="Close conversations" onClick={() => { setDrawerOpen(false); menuRef.current?.focus() }}><XIcon /></button><ConversationList controller={controller} activeConversationId={activeId} onConversationChange={selectConversation} /></aside></> : null}
        <main className="a2a-main">
          {activeId && !empty ? <A2AMessages controller={controller} conversationId={activeId} eventRenderers={eventRenderers} partRenderers={partRenderers} fileUriResolver={fileUriResolver} className={messagesClassName} maxWidth="4xl" /> : null}
          {activeId ? <div className={cn("a2a-compose-area", empty && "a2a-welcome")}>
            {empty && welcomeMessage ? <h2>{welcomeMessage}</h2> : null}
            <A2AInput controller={controller} conversationId={activeId} placeholder={inputPlaceholder} attachmentAdapter={attachmentAdapter} accept={accept} maxFiles={maxFiles} maxFileSize={maxFileSize} maxTotalBytes={maxTotalBytes} dataParts={dataParts} />
            {empty && promptSuggestions.length ? <A2APromptSuggestions>{promptSuggestions.map((suggestion) => <A2APromptSuggestion controller={controller} conversationId={activeId} prompt={suggestion.prompt ?? suggestion.label} key={suggestion.label}>{suggestion.icon}<span>{suggestion.label}</span></A2APromptSuggestion>)}</A2APromptSuggestions> : null}
          </div> : null}
        </main>
      </div>
    </section>
  )
}

export function A2AChat(props: A2AChatProps) {
  const {
    target, autoConnect, repository, recovery, fetch, authentication, clientFactory, resolveCard,
    supportedExtensionUris, ...shellProps
  } = props
  return <A2AChatProvider target={target} autoConnect={autoConnect} repository={repository} recovery={recovery} fetch={fetch} authentication={authentication} clientFactory={clientFactory} resolveCard={resolveCard} supportedExtensionUris={supportedExtensionUris}><ChatShell {...shellProps} configuredTarget={target} /></A2AChatProvider>
}
