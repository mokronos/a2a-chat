import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { A2AChat } from "@mokronos/a2a-chat-ui"
import { inspectorEventRenderers } from "@mokronos/a2a-chat-ui/inspector"

const STARTER_PROMPTS = [
  "What can you do?",
  "Summarize the latest task output",
  "Tell another agent to tell you a joke",
  "Show me the available tools",
  'Send another agent the task "Tell another agent to tell you a joke"',
]
const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Missing #root element")
}

createRoot(rootElement).render(
  <StrictMode>
    <A2AChat
      target={{ kind: "proxy", targetId: "local", basePath: "/api/a2a" }}
      autoConnect
      allowDirectUrl={false}
      title="A2A Inspector"
      description="Conversation-first A2A agent inspector"
      welcomeMessage="How can I help?"
      promptSuggestions={STARTER_PROMPTS.map((label) => ({ label }))}
      eventRenderers={inspectorEventRenderers}
      fillHeight
    />
  </StrictMode>
)
