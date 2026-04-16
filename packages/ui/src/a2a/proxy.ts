import type { A2AProxyTransport } from "./types"

const DEFAULT_PROXY_BASE_PATH = "/api/a2a"

export function normalizeProxyBasePath(basePath?: string): string {
  const rawPath = (basePath ?? DEFAULT_PROXY_BASE_PATH).trim()

  if (!rawPath.startsWith("/")) {
    return `/${rawPath.replace(/\/+$/, "")}`
  }

  return rawPath.replace(/\/+$/, "")
}

export function createProxyTransport(basePath?: string): A2AProxyTransport {
  return {
    basePath: normalizeProxyBasePath(basePath),
  }
}

export function createAgentCardProxyUrl(transport: A2AProxyTransport, targetUrl: string): string {
  const params = new URLSearchParams({ target: targetUrl })
  return `${transport.basePath}/agent-card?${params.toString()}`
}

export function createJsonRpcProxyUrl(transport: A2AProxyTransport, endpoint: string): string {
  const params = new URLSearchParams({ target: endpoint })
  return `${transport.basePath}/jsonrpc?${params.toString()}`
}
