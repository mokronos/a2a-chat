import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { useA2AChatController } from "./use-a2a-chat"
import type { A2AChatPersistenceAdapter, UseA2AChatResult } from "./use-a2a-chat"

const A2AChatContext = React.createContext<UseA2AChatResult | null>(null)

export type A2AChatProviderProps = {
  initialUrl?: string
  proxyBasePath?: string | false
  autoConnect?: boolean
  persistence?: A2AChatPersistenceAdapter
  children: React.ReactNode
}

function A2AChatController({
  children,
  initialUrl,
  proxyBasePath,
  autoConnect,
  persistence,
}: A2AChatProviderProps) {
  const value = useA2AChatController({ initialUrl, proxyBasePath, autoConnect, persistence })

  return <A2AChatContext.Provider value={value}>{children}</A2AChatContext.Provider>
}

/**
 * Owns the A2A chat logic and shares it with every primitive below it via context.
 * Drop the primitives (`A2AMessages`, `A2AInput`, …) anywhere inside it and arrange
 * them however you like, or read the state directly with {@link useA2AChat}.
 */
export function A2AChatProvider({ children, ...options }: A2AChatProviderProps) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <A2AChatController {...options}>{children}</A2AChatController>
    </QueryClientProvider>
  )
}

/**
 * Read the live A2A chat state and handlers. Must be called inside an
 * {@link A2AChatProvider}. Use this to build fully custom layouts.
 */
export function useA2AChat(): UseA2AChatResult {
  const ctx = React.useContext(A2AChatContext)

  if (!ctx) {
    throw new Error("useA2AChat must be used within <A2AChatProvider>")
  }

  return ctx
}
