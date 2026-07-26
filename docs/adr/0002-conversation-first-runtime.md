# ADR 0002: Conversations Own UI State

## Status

Accepted

## Context

Task-session UI state coupled rendering to one transport task and made persistence, selection, and concurrent requests ambiguous.

## Decision

The headless runtime owns conversations containing turns. A turn records a request and its A2A stream. UI primitives select a conversation explicitly; `A2AChat` provides the standard active-conversation shell.

## Consequences

Composable message and input components require a `conversationId`. Hosts can render multiple conversations or replace the default selector without reimplementing protocol orchestration.
