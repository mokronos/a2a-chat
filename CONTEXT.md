# Domain Glossary

## A2A target

A server-owned configuration entry that names an upstream A2A agent, its endpoint URLs, redirect policy, and optional injected credentials. A browser selects a target ID, never an arbitrary upstream URL.

## Connection target

A runtime connection choice. It is either a direct agent URL, a proxy target ID, or an injected SDK client. Direct connections are a host-level decision and are disabled by the inspector.

## Conversation

A local, durable collection of user-agent turns. Conversations are independent from A2A task IDs and may contain multiple tasks.

## Turn

One user request and the A2A events produced while handling it. A turn retains request parts, task events, reconstructed artifacts, and lifecycle state.

## Artifact

An A2A task output. Artifacts are projected into the assistant answer, unlike status events which describe work.

## Renderer

A pure UI function that can claim an A2A part or event. Renderers are ordered; the first non-null result wins and errors fall through to the next renderer.

## Attachment adapter

The host policy that converts browser `File` values into A2A file parts. The built-in adapter emits inline base64; upload adapters can emit trusted URIs instead.
