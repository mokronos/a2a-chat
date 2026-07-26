"use client"

import * as React from "react"
import {
  useA2AChatController,
  type A2AChat,
  type UseA2AChatOptions,
} from "./use-a2a-chat"

const A2AChatContext = React.createContext<A2AChat | null>(null)

export type A2AChatProviderProps = UseA2AChatOptions & { children: React.ReactNode }

export function A2AChatProvider({ children, ...options }: A2AChatProviderProps) {
  const controller = useA2AChatController(options)
  return <A2AChatContext.Provider value={controller}>{children}</A2AChatContext.Provider>
}

export function useA2AChat(): A2AChat {
  const value = React.useContext(A2AChatContext)
  if (!value) throw new Error("useA2AChat must be used inside A2AChatProvider")
  return value
}
