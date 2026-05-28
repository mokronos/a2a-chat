import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { InputBox } from "./components/shared/input-box"
import { MessageBox } from "./components/shared/message-box"
import type { MessageTimelineEventRenderer } from "./components/shared/message-box"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Separator } from "./components/ui/separator"
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
  layout?: "default" | "panel"
  agentSuggestions?: A2AAgentSuggestion[]
  eventRenderers?: MessageTimelineEventRenderer[]
  persistence?: A2AChatPersistenceAdapter
}

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

function getAgentButtonLabel(agentName: string | null, agentUrl: string): string {
  if (agentName && agentName.trim().length > 0) {
    return agentName.trim()
  }

  return agentUrl
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
  showRecentAgents,
  showTaskSessions = true,
  layout = "default",
  agentSuggestions = [],
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
    recentAgents,
    taskSessions,
    activeTaskSessionId,
    handleConnect,
    handleSelectRecentAgent,
    handleSubmitTask,
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
  const shouldShowRecentAgents = showRecentAgents ?? !isPanel

  return (
    <Card className={cn("w-full max-w-5xl", isPanel && "flex h-full min-w-0 max-w-none flex-col overflow-hidden", className)}>
      {showHeader ? (
        <CardHeader className={cn("border-b border-border", isPanel && "shrink-0 gap-2 p-3")}>
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

      <CardContent className={cn(isPanel && "min-h-0 flex-1 p-3", contentClassName)}>
        <div className={cn("grid min-w-0 gap-4", isPanel ? "h-full min-h-0 grid-rows-[auto_1fr]" : "md:grid-cols-[15rem_1fr]")}>
          {shouldShowRecentAgents || showTaskSessions ? (
            <aside className={cn("flex min-w-0 flex-col gap-4 border-b border-border pb-4", !isPanel && "md:border-r md:border-b-0 md:pb-0 md:pr-4")}>
              {shouldShowRecentAgents ? (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Recent Agents
                  </div>
                  <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                    {recentAgents.length > 0 ? (
                      recentAgents.map((agent) => (
                        <Button
                          key={agent.url}
                          type="button"
                          variant={agent.url === url ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSelectRecentAgent(agent.url)}
                          className="justify-start"
                          title={agent.url}
                        >
                          <span className="truncate">{getAgentButtonLabel(agent.agentName, agent.url)}</span>
                        </Button>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No recent agent connections yet.</div>
                    )}
                  </div>
                </div>
              ) : null}

            {showTaskSessions ? <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateTaskSession}
                disabled={connectionState !== "connected"}
                className="w-full justify-start"
                aria-label="New task"
                title="New task"
              >
                <PlusIcon />
                <span>New Task</span>
              </Button>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tasks
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-y-auto pb-1">
                {taskSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant={session.id === activeTaskSessionId ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSelectTaskSession(session.id)}
                      className="min-w-0 flex-1 justify-start"
                      title={session.title}
                    >
                      <span className="truncate">{session.title}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteTaskSession(session.id)}
                      aria-label={`Delete task ${session.title}`}
                      title={`Delete task ${session.title}`}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
              </div>
            </div> : null}
            </aside>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <MessageBox messages={messages} eventRenderers={eventRenderers} className={cn(isPanel && "min-h-0 flex-1", messagesClassName)} />
            <Separator />
            <InputBox
              value={taskInput}
              onChange={setTaskInput}
              onSubmit={handleSubmitTask}
              disabled={connectionState !== "connected" || isSending}
            />
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
