# ADR 0001: Proxy Only Configured Target IDs

## Status

Accepted

## Context

A caller-selected proxy URL creates an SSRF boundary and makes redirect and credential policy difficult to enforce consistently.

## Decision

The production proxy accepts `targetId` query parameters and resolves them through a server-owned target registry. Targets own endpoint URLs, injected headers, and permitted redirect origins. Development URL handling is available only through an explicit development policy.

## Consequences

Browser UI must model proxy connections as `{ kind: "proxy", targetId }`. Deployments add or change upstream agents through server configuration, not user input.
