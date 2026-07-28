import type { AgentCard } from "@a2a-js/sdk"
import type { ConnectionTarget } from "./types"

/** The header a browser uses to hand its credential to the same-origin proxy. */
export const CLIENT_CREDENTIAL_HEADER = "x-a2a-credential"

/** An agent card security scheme this runtime can satisfy with a pasted secret. */
export type AgentAuthRequirement = {
  readonly schemeName: string
  readonly kind: "bearer" | "apiKey"
  /** Header the secret goes into on a direct connection. */
  readonly header: string
  readonly prefix: string
  readonly description?: string
}

export type AuthStatus = "not-required" | "required" | "provided" | "accepted" | "rejected"

export type AuthState = {
  /** Present when the connected agent card declares a scheme we can satisfy. */
  readonly requirement?: AgentAuthRequirement
  readonly hasCredential: boolean
  readonly status: AuthStatus
}

export type CredentialStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

const STORAGE_PREFIX = "a2a-chat:credential:"

/**
 * Reads the first agent card scheme that a single pasted secret can satisfy.
 *
 * `security` lists alternative requirement sets; any one of them grants access,
 * so the first supported scheme is enough. OAuth and OpenID Connect need a flow
 * rather than a secret, so they are left for a host-supplied handler.
 */
export function agentAuthRequirement(card: AgentCard): AgentAuthRequirement | undefined {
  const schemes = card.securitySchemes
  if (!schemes) return undefined

  for (const requirement of card.security ?? []) {
    for (const schemeName of Object.keys(requirement)) {
      const scheme = schemes[schemeName]
      if (!scheme) continue

      if (scheme.type === "http" && scheme.scheme.toLowerCase() === "bearer") {
        return {
          schemeName,
          kind: "bearer",
          header: "authorization",
          prefix: "Bearer ",
          description: scheme.description,
        }
      }
      if (scheme.type === "apiKey" && scheme.in === "header") {
        return {
          schemeName,
          kind: "apiKey",
          header: scheme.name.toLowerCase(),
          prefix: "",
          description: scheme.description,
        }
      }
    }
  }
  return undefined
}

/** Stable per-agent key so one browser can hold credentials for several agents. */
export function credentialKey(target: ConnectionTarget): string | undefined {
  if (target.kind === "proxy") return `proxy:${target.basePath ?? ""}:${target.targetId}`
  if (target.kind === "direct") return `direct:${target.baseUrl}`
  return undefined
}

export function defaultCredentialStorage(): CredentialStorage | undefined {
  try {
    return globalThis.sessionStorage ?? undefined
  } catch {
    // Storage access throws in sandboxed frames and in some privacy modes.
    return undefined
  }
}

export function readCredential(storage: CredentialStorage, key: string): string | undefined {
  try {
    return storage.getItem(`${STORAGE_PREFIX}${key}`) ?? undefined
  } catch {
    return undefined
  }
}

export function writeCredential(
  storage: CredentialStorage,
  key: string,
  value: string | undefined,
): void {
  try {
    if (value === undefined) storage.removeItem(`${STORAGE_PREFIX}${key}`)
    else storage.setItem(`${STORAGE_PREFIX}${key}`, value)
  } catch {
    // A credential that cannot be persisted still works for this session.
  }
}

/**
 * Headers that carry the secret for one connection target.
 *
 * Proxy connections never name an upstream auth header: the proxy owns that
 * translation, so the browser cannot aim a credential at an arbitrary agent.
 */
export function credentialHeaders(input: {
  readonly target: ConnectionTarget
  readonly credential: string | undefined
  readonly requirement: AgentAuthRequirement | undefined
}): Record<string, string> {
  const { credential } = input
  if (!credential) return {}
  if (input.target.kind === "proxy") return { [CLIENT_CREDENTIAL_HEADER]: credential }
  if (input.target.kind === "direct") {
    const requirement = input.requirement
    return requirement
      ? { [requirement.header]: `${requirement.prefix}${credential}` }
      : { authorization: `Bearer ${credential}` }
  }
  return {}
}
