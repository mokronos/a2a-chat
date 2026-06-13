import React from "react"
import { ImageIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PencilIcon, PlusIcon, SearchIcon } from "lucide-react"

import { A2AChatProvider, useA2AChat } from "./a2a/context"
import type { A2AChatProviderProps } from "./a2a/context"
import { A2AConnectionForm } from "./components/a2a/connection-form"
import type { A2AAgentSuggestion } from "./components/a2a/connection-form"
import { A2AConnectionStatus } from "./components/a2a/connection-status"
import { A2AMessages } from "./components/a2a/messages"
import { A2AInput } from "./components/a2a/input"
import { A2APromptSuggestion, A2APromptSuggestions } from "./components/a2a/prompt-suggestions"
import { A2ATaskList } from "./components/a2a/task-list"
import type { MessageTimelineEventRenderer } from "./components/shared/message-box"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import { Button } from "./components/ui/button"
import { cn } from "./lib/utils"

export type A2AChatPromptSuggestion = {
  label: string
  prompt?: string
  icon?: React.ReactNode
}

export type A2AChatProps = Pick<
  A2AChatProviderProps,
  "initialUrl" | "proxyBasePath" | "autoConnect" | "persistence"
> & {
  className?: string
  contentClassName?: string
  messagesClassName?: string
  title?: string
  description?: string
  showConnectionForm?: boolean
  showHeader?: boolean
  showConnectionStatus?: boolean
  showTaskSessions?: boolean
  /** Fill the parent's height (like the panel layout) while keeping the chosen layout. */
  fillHeight?: boolean
  /** Allow the sidebar (tasks) to collapse to a thin rail. Default layout only. */
  collapsibleSidebar?: boolean
  layout?: "default" | "panel"
  agentSuggestions?: A2AAgentSuggestion[]
  promptSuggestions?: A2AChatPromptSuggestion[]
  welcomeMessage?: string
  inputPlaceholder?: string
  eventRenderers?: MessageTimelineEventRenderer[]
}

const defaultPromptSuggestions: A2AChatPromptSuggestion[] = [
  { label: "Create an image", icon: <ImageIcon className="size-4" aria-hidden="true" /> },
  { label: "Write or edit", icon: <PencilIcon className="size-4" aria-hidden="true" /> },
  { label: "Look something up", icon: <SearchIcon className="size-4" aria-hidden="true" /> },
]

type A2AChatCardProps = Omit<
  A2AChatProps,
  "initialUrl" | "proxyBasePath" | "autoConnect" | "persistence"
>

function A2AChatCard({
  className,
  contentClassName,
  messagesClassName,
  title = "A2A Chat",
  description = "Reusable chat shell component",
  showConnectionForm = true,
  showHeader = true,
  showConnectionStatus = true,
  showTaskSessions = true,
  fillHeight = false,
  collapsibleSidebar = false,
  layout = "default",
  agentSuggestions = [],
  promptSuggestions = defaultPromptSuggestions,
  welcomeMessage = "How can I help?",
  inputPlaceholder = "Ask anything",
  eventRenderers,
}: A2AChatCardProps) {
  const { messages, connectionState, handleCreateTaskSession } = useA2AChat()

  const isPanel = layout === "panel"
  // The panel layout always fills its parent; default layout opts in via `fillHeight`.
  const fills = isPanel || fillHeight
  const sidebarVisible = showTaskSessions
  const canCollapse = collapsibleSidebar && !isPanel
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const collapsed = canCollapse && sidebarCollapsed
  const isEmpty = messages.length === 0

  return (
    <Card className={cn("w-full max-w-5xl", fills && "flex h-full min-w-0 max-w-none flex-col overflow-hidden", className)}>
      {showHeader ? (
        <CardHeader className={cn("border-b border-border", fills && "shrink-0", isPanel && "gap-2 p-3")}>
          <CardTitle className={cn(isPanel && "text-base")}>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}

          {showConnectionForm ? (
            <A2AConnectionForm className="mt-2" agentSuggestions={agentSuggestions} />
          ) : null}

          {showConnectionStatus ? <A2AConnectionStatus className="mt-2" /> : null}
        </CardHeader>
      ) : null}

      <CardContent className={cn(fills && "min-h-0 flex-1", isPanel && "p-3", contentClassName)}>
        <div
          className={cn(
            "grid min-w-0 gap-4",
            isPanel
              ? "h-full min-h-0 grid-rows-[auto_1fr]"
              : cn(
                  fillHeight && "h-full min-h-0",
                  !sidebarVisible
                    ? "grid-cols-1"
                    : collapsed
                      ? "md:grid-cols-[auto_1fr]"
                      : "md:grid-cols-[15rem_1fr]",
                ),
          )}
        >
          {sidebarVisible && collapsed ? (
            <div className="flex items-center justify-between gap-2 border-b border-border pb-2 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:pb-0 md:pr-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSidebarCollapsed(false)}
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <PanelLeftOpenIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleCreateTaskSession}
                disabled={connectionState !== "connected"}
                aria-label="New task"
                title="New task"
              >
                <PlusIcon />
              </Button>
            </div>
          ) : null}

          {sidebarVisible && !collapsed ? (
            <aside className={cn("flex min-w-0 flex-col gap-4 border-b border-border pb-4", !isPanel && "md:border-r md:border-b-0 md:pb-0 md:pr-4")}>
              {canCollapse ? (
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSidebarCollapsed(true)}
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar"
                  >
                    <PanelLeftCloseIcon />
                  </Button>
                </div>
              ) : null}
              <A2ATaskList className="flex-1" />
            </aside>
          ) : null}

          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col gap-3 transition-all duration-300",
              isEmpty ? "justify-center py-8" : "justify-end",
              fills && "h-full",
            )}
          >
            {!isEmpty ? (
              <A2AMessages eventRenderers={eventRenderers} className={cn(fills ? "min-h-0 flex-1" : "h-96", messagesClassName)} />
            ) : null}
            {isEmpty ? (
              <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
                {welcomeMessage ? (
                  <h2 className="text-center text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                    {welcomeMessage}
                  </h2>
                ) : null}
                <A2AInput placeholder={inputPlaceholder} className="w-full" />
                {promptSuggestions.length > 0 ? (
                  <A2APromptSuggestions>
                    {promptSuggestions.map((suggestion) => (
                      <A2APromptSuggestion
                        key={suggestion.label}
                        prompt={suggestion.prompt ?? suggestion.label}
                      >
                        {suggestion.icon}
                        <span>{suggestion.label}</span>
                      </A2APromptSuggestion>
                    ))}
                  </A2APromptSuggestions>
                ) : null}
              </div>
            ) : (
              <A2AInput placeholder={inputPlaceholder} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Batteries-included preset: one opinionated arrangement of the A2A primitives.
 * For custom layouts, compose {@link A2AChatProvider} with the individual
 * `A2A*` components instead.
 */
export function A2AChat({ initialUrl, proxyBasePath, autoConnect, persistence, ...cardProps }: A2AChatProps) {
  return (
    <A2AChatProvider
      initialUrl={initialUrl}
      proxyBasePath={proxyBasePath}
      autoConnect={autoConnect}
      persistence={persistence}
    >
      <A2AChatCard {...cardProps} />
    </A2AChatProvider>
  )
}
