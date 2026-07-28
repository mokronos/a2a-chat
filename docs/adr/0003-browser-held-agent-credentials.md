# ADR 0003: Browser-Held Agent Credentials Travel In A Neutral Header

## Status

Accepted

## Context

[ADR 0001](0001-secure-target-registry.md) makes upstream endpoints and credentials
server-owned, and the proxy hard-blocks `Authorization` on inbound browser requests.
That fits an agent whose secret belongs to the deployment, but not a shared demo agent
where the person at the keyboard holds the token and the A2A agent card advertises the
scheme (`securitySchemes` / `security`) it expects.

Forwarding an inbound `Authorization` header verbatim would reintroduce the confused
deputy the block prevents: any target could receive a credential minted for another.

## Decision

The browser sends its secret in `x-a2a-credential`, never in an upstream auth header.
A target opts in with `clientCredential`, which names the translation the proxy applies:
`{ kind: "bearer" }` becomes `Authorization: Bearer <secret>`, and
`{ kind: "header", name }` sends the secret verbatim under that header. Targets without
the option ignore the credential entirely, server-configured headers still win, and the
credential is dropped as soon as a redirect leaves the target's origin.

Clients discover the requirement from the agent card and keep the secret in
`sessionStorage`; `www-authenticate` passes back through so a 401 becomes a prompt.

## Consequences

A deployment decides per target whether a user-held credential is even possible, and the
browser can never aim one at an agent that did not ask for it. Schemes that need a flow
rather than a secret (OAuth2, OpenID Connect) stay out of scope and remain the job of a
host-supplied `authentication` handler.
