import type { AgentCard, Message as A2AProtocolMessage, Task } from "@a2a-js/sdk"
import { Client, JsonRpcTransport } from "@a2a-js/sdk/client"

import { createAgentCardProxyUrl, createJsonRpcProxyUrl } from "./proxy"
import type { A2AClient, A2AConversationState } from "./types"
import type { A2AProxyTransport } from "./types"

const JSON_RPC_TRANSPORT = "JSONRPC"

type CardInterface = {
  url?: unknown
  transport?: unknown
  protocolBinding?: unknown
}

type CompatibleAgentCard = AgentCard & {
  supportedInterfaces?: CardInterface[]
  additionalInterfaces?: CardInterface[]
  url?: string
}

export function createId(prefix: string) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeBaseUrl(url: string) {
  const rawUrl = url.trim()
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`
  return withProtocol.replace(/\/$/, "")
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function resolveEndpointUrl(baseUrl: string, url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  if (url.startsWith("/")) {
    return `${baseUrl}${url}`
  }

  return `${baseUrl}/${url}`
}

export function resolveJsonRpcEndpoint(baseUrl: string, agentCard: unknown): string {
  if (!isRecord(agentCard)) {
    return baseUrl
  }

  const card = agentCard as unknown as CompatibleAgentCard
  const interfaces = [
    ...(Array.isArray(card.supportedInterfaces) ? card.supportedInterfaces : []),
    ...(Array.isArray(card.additionalInterfaces) ? card.additionalInterfaces : []),
  ]

  for (const item of interfaces) {
    if (!isRecord(item) || typeof item.url !== "string") {
      continue
    }

    const binding =
      typeof item.transport === "string"
        ? item.transport
        : typeof item.protocolBinding === "string"
          ? item.protocolBinding
          : null

    if (binding !== JSON_RPC_TRANSPORT) {
      continue
    }

    return resolveEndpointUrl(baseUrl, item.url)
  }

  if (typeof card.url === "string" && card.url.length > 0) {
    return resolveEndpointUrl(baseUrl, card.url)
  }

  return baseUrl
}

export async function createJsonRpcClient(
  baseUrl: string,
  transport: A2AProxyTransport
): Promise<{
  client: A2AClient
  agentName: string | null
  endpoint: string
  acceptedOutputModes: string[]
}> {
  const cardUrl = createAgentCardProxyUrl(transport, baseUrl)
  const cardResponse = await fetch(cardUrl)

  if (!cardResponse.ok) {
    throw new Error(`Could not fetch agent card (${cardResponse.status})`)
  }

  const agentCard = (await cardResponse.json()) as CompatibleAgentCard
  const upstreamEndpoint = resolveJsonRpcEndpoint(baseUrl, agentCard)
  const proxyEndpoint = createJsonRpcProxyUrl(transport, upstreamEndpoint)
  const client = new Client(new JsonRpcTransport({ endpoint: proxyEndpoint }), agentCard)
  const agentName = typeof agentCard.name === "string" ? agentCard.name : null
  const acceptedOutputModes = Array.isArray(agentCard.defaultOutputModes)
    ? agentCard.defaultOutputModes.filter(
        (mode): mode is string => typeof mode === "string" && mode.length > 0
      )
    : []

  return { client, agentName, endpoint: upstreamEndpoint, acceptedOutputModes }
}

export function buildA2AMessage(
  text: string,
  conversationState: A2AConversationState
): A2AProtocolMessage {
  return {
    kind: "message",
    messageId: createId("msg"),
    role: "user",
    parts: [{ kind: "text", text }],
    contextId: conversationState.contextId,
  }
}

export function extractTextFromParts(parts: unknown): string[] {
  if (!Array.isArray(parts)) {
    return []
  }

  return parts.flatMap((part) => {
    if (isRecord(part) && typeof part.text === "string") {
      return [part.text]
    }

    return []
  })
}

export function getTaskText(task: Task, streamNotes: string[] = []): string {
  const fragments = [
    ...streamNotes,
    ...(task.artifacts?.flatMap((artifact) => extractTextFromParts(artifact.parts)) ?? []),
  ]

  return fragments.join("\n")
}

export function extractTask(value: unknown): Task | null {
  const normalizeTask = (candidate: Record<string, unknown>): Task | null => {
    const directState =
      isRecord(candidate.status) && typeof candidate.status.state === "string"
        ? candidate.status.state
        : null

    if (typeof candidate.id !== "string" || !directState) {
      return null
    }

    const contextId =
      typeof candidate.contextId === "string"
        ? candidate.contextId
        : typeof candidate.context_id === "string"
          ? candidate.context_id
          : undefined

    const taskCandidate = candidate as unknown as Task
    if (typeof contextId !== "string") {
      return taskCandidate
    }

    return {
      ...taskCandidate,
      contextId,
    }
  }

  if (!isRecord(value)) {
    return null
  }

  const directTask = normalizeTask(value)
  if (directTask) {
    return directTask
  }

  const nested = value.task
  if (isRecord(nested)) {
    const nestedTask = normalizeTask(nested)
    if (nestedTask) {
      return nestedTask
    }
  }

  return null
}

export function getClientCardName(client: A2AClient): string | null {
  const candidate = (client as unknown as { agentCard?: unknown }).agentCard
  if (!isRecord(candidate) || typeof candidate.name !== "string") {
    return null
  }

  return candidate.name
}
