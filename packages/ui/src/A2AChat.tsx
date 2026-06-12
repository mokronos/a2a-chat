import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ImageIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"

import { InputBox } from "./components/shared/input-box"
import { MessageBox } from "./components/shared/message-box"
import type { MessageTimelineEventRenderer } from "./components/shared/message-box"
import { Suggestion, Suggestions } from "./components/ai-elements/suggestion"
import type { PromptInputMessage } from "./components/ai-elements/prompt-input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { cn } from "./lib/utils"
import { useA2AChat } from "./a2a/use-a2a-chat"
import type { A2AChatPersistenceAdapter } from "./a2a/use-a2a-chat"
import { inspectorEventRenderers } from "./a2a/inspector-event-renderers"
import type { ConnectionState } from "./a2a/types"

export type A2AAgentSuggestion = {
  label: string
  url: string
  description?: string
}

export type A2AChatPromptSuggestion = {
  label: string
  prompt?: string
  icon?: React.ReactNode
}

export type A2AChatProps = {
  className?: string
  contentClassName?: string
  messagesClassName?: string
  title?: string
  description?: string
  initialUrl?: string
  proxyBasePath?: string | false
  autoConnect?: boolean
  showConnectionForm?: boolean
  showHeader?: boolean
  showConnectionStatus?: boolean
  showRecentAgents?: boolean
  showTaskSessions?: boolean
  /** Fill the parent's height (like the panel layout) while keeping the chosen layout. */
  fillHeight?: boolean
  /** Allow the sidebar (recent agents / tasks) to collapse to a thin rail. Default layout only. */
  collapsibleSidebar?: boolean
  layout?: "default" | "panel"
  agentSuggestions?: A2AAgentSuggestion[]
  promptSuggestions?: A2AChatPromptSuggestion[]
  welcomeMessage?: string
  inputPlaceholder?: string
  eventRenderers?: MessageTimelineEventRenderer[]
  persistence?: A2AChatPersistenceAdapter
}

const defaultPromptSuggestions: A2AChatPromptSuggestion[] = [
  { label: "Create an image", icon: <ImageIcon className="size-4" aria-hidden="true" /> },
  { label: "Write or edit", icon: <PencilIcon className="size-4" aria-hidden="true" /> },
  { label: "Look something up", icon: <SearchIcon className="size-4" aria-hidden="true" /> },
]

function getStatusClasses(state: ConnectionState) {
  if (state === "connected") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
  }

  if (state === "connecting") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700"
  }

  if (state === "error") {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }

  return "border-border bg-muted text-muted-foreground"
}

function A2AChatCard({
  className,
  contentClassName,
  messagesClassName,
  title = "A2A Chat",
  description = "Reusable chat shell component",
  initialUrl,
  proxyBasePath,
  autoConnect,
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
  eventRenderers = inspectorEventRenderers,
  persistence,
}: A2AChatProps) {
  const {
    url,
    setUrl,
    connectionState,
    connectionMessage,
    agentName,
    taskInput,
    setTaskInput,
    isSending,
    messages,
    taskSessions,
    activeTaskSessionId,
    handleConnect,
    handleSubmitTask,
    handleCancelTask,
    handleCreateTaskSession,
    handleSelectTaskSession,
    handleDeleteTaskSession,
  } = useA2AChat({
    initialUrl,
    proxyBasePath,
    autoConnect,
    persistence,
  })

  const isPanel = layout === "panel"
  // The panel layout always fills its parent; default layout opts in via `fillHeight`.
  const fills = isPanel || fillHeight
  const sidebarVisible = showTaskSessions
  const canCollapse = collapsibleSidebar && !isPanel
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [taskSearch, setTaskSearch] = React.useState("")
  const collapsed = canCollapse && sidebarCollapsed
  const isEmpty = messages.length === 0
  const filteredTaskSessions = React.useMemo(() => {
    const query = taskSearch.trim().toLowerCase()
    if (query.length === 0) {
      return taskSessions
    }

    return taskSessions.filter((session) => session.title.toLowerCase().includes(query))
  }, [taskSearch, taskSessions])

  const submitTask = React.useCallback(
    (message?: PromptInputMessage) => {
      const files = message?.files ?? []

      const baseText = message?.text ?? taskInput
      const fileSummary = files
        .map((file) => file.filename)
        .filter((filename): filename is string => typeof filename === "string" && filename.length > 0)
        .join(", ")
      const taskText = fileSummary.length > 0 ? `${baseText}\n\nAttached files: ${fileSummary}` : baseText

      handleSubmitTask(taskText)
    },
    [handleSubmitTask, setTaskInput, taskInput]
  )

  const handlePromptSuggestion = React.useCallback(
    (suggestion: A2AChatPromptSuggestion) => {
      const prompt = suggestion.prompt ?? suggestion.label
      setTaskInput(prompt)
    },
    [setTaskInput]
  )

  return (
    <Card className={cn("w-full max-w-5xl", fills && "flex h-full min-w-0 max-w-none flex-col overflow-hidden", className)}>
      {showHeader ? (
        <CardHeader className={cn("border-b border-border", fills && "shrink-0", isPanel && "gap-2 p-3")}>
          <CardTitle className={cn(isPanel && "text-base")}>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}

          {showConnectionForm ? (
            <form
              className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault()
                handleConnect()
              }}
            >
              <Input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="http://localhost:8000"
                aria-label="A2A server URL"
                list={agentSuggestions.length > 0 ? "a2a-agent-suggestions" : undefined}
              />
              {agentSuggestions.length > 0 ? (
                <datalist id="a2a-agent-suggestions">
                  {agentSuggestions.map((suggestion) => (
                    <option
                      key={suggestion.url}
                      value={suggestion.url}
                      label={
                        suggestion.description
                          ? `${suggestion.label} - ${suggestion.description}`
                          : suggestion.label
                      }
                    />
                  ))}
                </datalist>
              ) : null}
              <Button
                type="submit"
                variant="outline"
                disabled={connectionState === "connecting"}
                className="h-9"
              >
                {connectionState === "connecting" ? "Connecting..." : "Connect"}
              </Button>
            </form>
          ) : null}

          {showConnectionStatus ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                  getStatusClasses(connectionState)
                )}
              >
                {connectionMessage}
              </div>
              {agentName ? <div className="text-xs text-muted-foreground">Agent: {agentName}</div> : null}
            </div>
          ) : null}

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
              {showTaskSessions ? (
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
              ) : null}
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
            {showTaskSessions ? <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tasks
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCreateTaskSession}
                  disabled={connectionState !== "connected"}
                  aria-label="New task"
                  title="New task"
                >
                  <PlusIcon />
                  <span>New</span>
                </Button>
              </div>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={taskSearch}
                  onChange={(event) => setTaskSearch(event.target.value)}
                  placeholder="Search tasks"
                  aria-label="Search tasks"
                  className="h-9 pl-9"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto pb-1">
                {filteredTaskSessions.length > 0 ? filteredTaskSessions.map((session) => {
                  const selected = session.id === activeTaskSessionId

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex min-w-0 items-center gap-2 rounded-xl border p-2 transition-colors",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted/60"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectTaskSession(session.id)}
                        className="min-w-0 flex-1 text-left"
                        title={session.title}
                      >
                        <span className="block truncate text-sm font-medium">{session.title}</span>
                        <span className={cn("mt-1 block text-xs", selected ? "text-primary-foreground/70" : "text-muted-foreground")}>Task session</span>
                      </button>
                      <Button
                        type="button"
                        variant={selected ? "secondary" : "ghost"}
                        size="icon-sm"
                        onClick={() => handleDeleteTaskSession(session.id)}
                        aria-label={`Delete task ${session.title}`}
                        title={`Delete task ${session.title}`}
                        className="shrink-0"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  )
                }) : (
                  <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    No tasks match your search.
                  </div>
                )}
              </div>
            </div> : null}
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
              <MessageBox messages={messages} eventRenderers={eventRenderers} className={cn(fills && "min-h-0 flex-1", messagesClassName)} />
            ) : null}
            {isEmpty ? (
              <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
                {welcomeMessage ? (
                  <h2 className="text-center text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                    {welcomeMessage}
                  </h2>
                ) : null}
                <InputBox
                  value={taskInput}
                  onChange={setTaskInput}
                  onSubmit={submitTask}
                  disabled={connectionState !== "connected"}
                  isSending={isSending}
                  onCancel={handleCancelTask}
                  placeholder={inputPlaceholder}
                  className="w-full"
                />
                {promptSuggestions.length > 0 ? (
                  <Suggestions>
                    {promptSuggestions.map((suggestion) => (
                      <Suggestion
                        key={suggestion.label}
                        suggestion={suggestion.label}
                        onClick={() => handlePromptSuggestion(suggestion)}
                      >
                        {suggestion.icon}
                        <span>{suggestion.label}</span>
                      </Suggestion>
                    ))}
                  </Suggestions>
                ) : null}
              </div>
            ) : (
              <InputBox
                value={taskInput}
                onChange={setTaskInput}
                onSubmit={submitTask}
                disabled={connectionState !== "connected"}
                isSending={isSending}
                onCancel={handleCancelTask}
                placeholder={inputPlaceholder}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function A2AChat(props: A2AChatProps) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <A2AChatCard {...props} />
    </QueryClientProvider>
  )
}
