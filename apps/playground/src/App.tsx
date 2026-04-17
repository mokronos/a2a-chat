import React from "react"
import { A2AChat, type A2AAgentSuggestion } from "@mokronos/a2a-chat-ui"

type AgentRecord = {
  id?: unknown
  name?: unknown
  description?: unknown
}

const defaultAgentRegistryUrl = "http://127.0.0.1:8787"

function normalizeRegistryBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, "")
}

export function App() {
  const [agentSuggestions, setAgentSuggestions] = React.useState<A2AAgentSuggestion[]>([])

  React.useEffect(() => {
    const controller = new AbortController()

    const loadSuggestions = async () => {
      const registryUrl = normalizeRegistryBaseUrl(defaultAgentRegistryUrl)
      const params = new URLSearchParams({ target: registryUrl })

      try {
        const response = await fetch(`/api/a2a/agents?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as unknown
        if (!Array.isArray(payload)) {
          return
        }

        const nextSuggestions = payload.flatMap((item) => {
          const candidate = item as AgentRecord
          if (typeof candidate.id !== "string" || candidate.id.length === 0) {
            return []
          }

          const label = typeof candidate.name === "string" && candidate.name.length > 0
            ? candidate.name
            : candidate.id
          const description =
            typeof candidate.description === "string" && candidate.description.length > 0
              ? candidate.description
              : undefined

          return [
            {
              label,
              description,
              url: `${registryUrl}/agents/${candidate.id}`,
            },
          ]
        })

        setAgentSuggestions(nextSuggestions)
      } catch {}
    }

    void loadSuggestions()

    return () => {
      controller.abort()
    }
  }, [])

  return <A2AChat agentSuggestions={agentSuggestions} />
}
