import React from "react"
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"

import { useA2AChat } from "@mokronos/a2a-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"

export type A2ATaskListProps = {
  className?: string
  /** Show the search field above the task list. Default: true. */
  showSearch?: boolean
}

/** Task session sidebar: search, create, select and delete sessions. */
export function A2ATaskList({ className, showSearch = true }: A2ATaskListProps) {
  const {
    taskSessions,
    activeTaskSessionId,
    connectionState,
    handleCreateTaskSession,
    handleSelectTaskSession,
    handleDeleteTaskSession,
  } = useA2AChat()

  const [search, setSearch] = React.useState("")

  const filteredSessions = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (query.length === 0) {
      return taskSessions
    }

    return taskSessions.filter((session) => session.title.toLowerCase().includes(query))
  }, [search, taskSessions])

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tasks</div>
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

      {showSearch ? (
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="h-9 pl-9"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto pb-1">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => {
            const selected = session.id === activeTaskSessionId

            return (
              <div
                key={session.id}
                className={cn(
                  "group flex min-w-0 items-center gap-2 rounded-xl border p-2 transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted/60"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelectTaskSession(session.id)}
                  className="min-w-0 flex-1 text-left"
                  title={session.title}
                >
                  <span className="block truncate text-sm font-medium">{session.title}</span>
                  <span
                    className={cn(
                      "mt-1 block text-xs",
                      selected ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    Task session
                  </span>
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
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            {search.trim().length > 0 ? "No tasks match your search." : "No tasks yet."}
          </div>
        )}
      </div>
    </div>
  )
}
