import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { InputBox } from "./components/shared/input-box"
import { MessageBox } from "./components/shared/message-box"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Separator } from "./components/ui/separator"
import { cn } from "./lib/utils"
import { useA2AChat } from "./a2a/use-a2a-chat"
import type { ConnectionState } from "./a2a/types"

export type A2AAgentSuggestion = {
  label: string
  url: string
  description?: string
}

export type A2AChatProps = {
  className?: string
  title?: string
  description?: string
  initialUrl?: string
  proxyBasePath?: string
  autoConnect?: boolean
  showConnectionForm?: boolean
  agentSuggestions?: A2AAgentSuggestion[]
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

function A2AChatCard({
  className,
  title = "A2A Chat",
  description = "Reusable chat shell component",
  initialUrl,
  proxyBasePath,
  autoConnect,
  showConnectionForm = true,
  agentSuggestions = [],
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
    handleCreateTaskSession,
    handleSelectTaskSession,
  } = useA2AChat({
    initialUrl,
    proxyBasePath,
    autoConnect,
  })

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader className="border-b border-border">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>

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

        <div className="mt-3 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCreateTaskSession}>
            New Task
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
            {taskSessions.map((session) => (
              <Button
                key={session.id}
                type="button"
                variant={session.id === activeTaskSessionId ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectTaskSession(session.id)}
                className="shrink-0"
                title={session.title}
              >
                {session.title}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <MessageBox messages={messages} />
      </CardContent>

      <Separator />

      <CardFooter>
        <div className="w-full">
          <InputBox
            value={taskInput}
            onChange={setTaskInput}
            onSubmit={handleSubmitTask}
            disabled={connectionState !== "connected" || isSending}
          />
        </div>
      </CardFooter>
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
