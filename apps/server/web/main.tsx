import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import {
  A2AChatProvider,
  A2AConnectionBar,
  A2AEmptyState,
  A2AInput,
  A2AMessages,
  A2APromptSuggestion,
  A2APromptSuggestions,
  A2ATaskList,
  inspectorEventRenderers,
} from "@mokronos/a2a-chat-ui"
import type { A2AAgentSuggestion } from "@mokronos/a2a-chat-ui"

/*
 * A2A Inspector — example host application (ChatGPT-style full-screen layout).
 *
 * Three layers, tagged inline:
 *   [EXTERNAL]      Host MUST provide — describes your deployment / domain.
 *   [CONFIGURABLE]  Host MAY tune — layout, copy, which primitives to show.
 *   [INTERNAL]      Components own it — you never wire it by hand.
 *
 * The earlier [DECIDE LATER] rough edges are now resolved in the library:
 *   • A2AMessages fills its parent by default (no more fixed-height box).
 *   • A2AMessages `maxWidth` centers content while the scroll stays full-bleed.
 *   • Connection status message is concise ("Connected").
 *   • A2AConnectionBar pairs form + status (used here, vertical, in the sidebar).
 *   • A2AEmptyState is a slot shown only while the conversation is empty.
 *   • A2AInput size is tuned via className (default lives in the component).
 */

// ─────────────────────────────────────────────────────────────────────────
// [EXTERNAL] Deployment + domain wiring
// ─────────────────────────────────────────────────────────────────────────

// Where A2A traffic is proxied. The apps/server backend forwards `/api/a2a`
// to the target agent so requests stay same-origin (no CORS, auth at the edge).
const PROXY_BASE_PATH = "/api/a2a"

// Pre-filled in the connection form; the user can still change it.
const INITIAL_URL = "http://localhost:8000"

// Domain-specific timeline renderers — the "inspector" part. Knows how to render
// this agent's send_task / check_task_status tool events. A different host ships its own.
const eventRenderers = inspectorEventRenderers

// Optional URL autocomplete for the connection form.
const agentSuggestions: A2AAgentSuggestion[] = [
  { label: "Local agent", url: "http://localhost:8000", description: "dev server" },
]

// ─────────────────────────────────────────────────────────────────────────
// [CONFIGURABLE] Copy + layout constants
// ─────────────────────────────────────────────────────────────────────────

const GREETING = "How can I help?"
const STARTER_PROMPTS = ["What can you do?", "Summarize the latest task output"]

// Width of the conversation column + input (the ChatGPT ~768px column).
const COLUMN = "mx-auto w-full max-w-3xl"

// ─────────────────────────────────────────────────────────────────────────
// [CONFIGURABLE] Layout — connection lives in the sidebar; the right pane is
// pure chat using the full height and width.
// ─────────────────────────────────────────────────────────────────────────

function Inspector() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar: connection + tasks. */}
      <aside className="flex w-72 shrink-0 flex-col gap-3 border-r border-border bg-muted/20 p-3">
        {/* [EXTERNAL] target via provider; [CONFIGURABLE] suggestions. A2AConnectionBar
            stacks the form + status vertically for the sidebar. */}
        <A2AConnectionBar orientation="vertical" agentSuggestions={agentSuggestions} />
        <div className="h-px bg-border" />
        {/* [INTERNAL] A2ATaskList owns create/select/delete. Fills the rest. */}
        <A2ATaskList className="min-h-0 flex-1" />
      </aside>

      {/* Right pane: messages + input, nothing else competing for space. */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          {/* [INTERNAL] streaming/timeline. [CONFIGURABLE] maxWidth centers the
              content column; the scroll area itself stays full-bleed. */}
          <A2AMessages eventRenderers={eventRenderers} maxWidth="3xl" className="h-full" />

          {/* [CONFIGURABLE] A2AEmptyState overlays the empty conversation with a
              greeting + starter prompts; it disappears on the first message. */}
          <A2AEmptyState className="absolute inset-0 gap-6 bg-background px-4">
            <h1 className="text-3xl font-semibold tracking-tight">{GREETING}</h1>
            <A2APromptSuggestions className="max-w-3xl justify-center">
              {STARTER_PROMPTS.map((prompt) => (
                <A2APromptSuggestion key={prompt} prompt={prompt} />
              ))}
            </A2APromptSuggestions>
          </A2AEmptyState>
        </div>

        {/* Input docked at the bottom, centered to the same column. */}
        <div className="shrink-0 px-4 pb-6 pt-2">
          <div className={COLUMN}>
            {/* [INTERNAL] A2AInput owns submit/cancel + streaming state. */}
            <A2AInput placeholder="Ask anything" />
          </div>
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Mount
// ─────────────────────────────────────────────────────────────────────────

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Missing #root element")
}

createRoot(rootElement).render(
  <StrictMode>
    {/* [EXTERNAL] connection target (+ optional persistence) is configured here.
        [INTERNAL] the provider runs the A2A client, streaming, and task-session
        state, and shares it with every primitive below via context. */}
    <A2AChatProvider proxyBasePath={PROXY_BASE_PATH} initialUrl={INITIAL_URL}>
      <Inspector />
    </A2AChatProvider>
  </StrictMode>
)
