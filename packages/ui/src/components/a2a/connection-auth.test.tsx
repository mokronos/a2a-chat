import * as React from "react"
import { describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import type { A2AChat, AuthState } from "@mokronos/a2a-react"
import { A2AConnectionAuth } from "./connection-auth"

function controllerWith(auth: AuthState): A2AChat {
  return { auth, setCredential: () => {}, clearCredential: () => {} } as unknown as A2AChat
}

function render(auth: AuthState, props: { alwaysVisible?: boolean } = {}) {
  return renderToStaticMarkup(
    <A2AConnectionAuth controller={controllerWith(auth)} {...props} />,
  )
}

describe("A2AConnectionAuth", () => {
  it("prompts with the card's scheme when the agent requires a credential", () => {
    const markup = render({
      status: "required",
      hasCredential: false,
      requirement: {
        schemeName: "bearer",
        kind: "bearer",
        header: "authorization",
        prefix: "Bearer ",
        description: "Shared token issued with this deployment.",
      },
    })

    expect(markup).toContain('type="password"')
    expect(markup).toContain("Bearer token")
    expect(markup).toContain("Shared token issued with this deployment.")
  })

  it("names the header for an api key scheme", () => {
    const markup = render({
      status: "required",
      hasCredential: false,
      requirement: {
        schemeName: "key",
        kind: "apiKey",
        header: "x-api-key",
        prefix: "",
      },
    })

    expect(markup).toContain("API key (x-api-key)")
  })

  it("stays out of the way until an agent asks", () => {
    expect(render({ status: "not-required", hasCredential: false })).toBe("")
    expect(render({ status: "not-required", hasCredential: false }, { alwaysVisible: true })).toContain(
      "input",
    )
  })

  it("flags a rejected credential and offers to clear it", () => {
    const markup = render({ status: "rejected", hasCredential: true })

    expect(markup).toContain('role="alert"')
    expect(markup).toContain("rejected")
    expect(markup).toContain("Clear")
    expect(markup).toContain('data-status="rejected"')
  })
})
