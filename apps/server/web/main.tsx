import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { A2AChat } from "@mokronos/a2a-chat-ui"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Missing #root element")
}

createRoot(rootElement).render(
  <StrictMode>
    <A2AChat proxyBasePath="/api/a2a" initialUrl="http://localhost:8000" />
  </StrictMode>
)
