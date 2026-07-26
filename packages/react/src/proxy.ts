export const DEFAULT_PROXY_BASE_PATH = "/api/a2a"

export function normalizeProxyBasePath(basePath = DEFAULT_PROXY_BASE_PATH): string {
  const value = basePath.trim().replace(/\/+$/, "")
  return value.startsWith("/") ? value || "/" : `/${value}`
}

export function createProxyEndpoint(
  basePath: string | undefined,
  path: "agent-card" | "jsonrpc",
  targetId: string,
) {
  const query = new URLSearchParams({ targetId })
  const base = normalizeProxyBasePath(basePath)
  return `${base === "/" ? "" : base}/${path}?${query}`
}

export function createDirectAgentCardUrl(baseUrl: string): string {
  return new URL(".well-known/agent-card.json", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString()
}
