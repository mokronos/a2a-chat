# A2A Conversation Protocol

`a2a-chat` treats a conversation as a local collection of turns. A turn starts with one user request, retains the stream of A2A task events, and finishes in a terminal, input-required, or recoverable lifecycle state.

## Event Placement

| Agent output | A2A event | UI projection |
| --- | --- | --- |
| Final answer or generated file | `TaskArtifactUpdateEvent` | Assistant answer content |
| Progress, tool activity, or concise status | `TaskStatusUpdateEvent` with `working` | Activity timeline |
| Question or approval | `TaskStatusUpdateEvent` with `input-required` | Reply composer or form |
| Completion or failure | terminal task status | Turn lifecycle |

Artifacts are answer content. Working status is process information. Do not stream answer text as a working-status message.

## Text And Files

Text parts are rendered as markdown. Use artifact updates with a stable `artifactId` and `append: true` to stream a response. Send files as spec-shaped `FilePart` values with a `mimeType`; image, audio, and video MIME types render inline, while other files render as downloads.

```json
{
  "kind": "file",
  "file": {
    "name": "report.pdf",
    "mimeType": "application/pdf",
    "uri": "https://files.example.com/report.pdf"
  }
}
```

Remote file URLs are a browser trust boundary. The default UI accepts only `http`, `https`, `blob`, and `data` URLs. Provide a `fileUriResolver` when the host needs a stricter policy.

## Structured Content

`DataPart` values are JSON and render with the generic data renderer unless a custom `PartRenderer` accepts them. Give application payloads a stable discriminator such as `type: "weather"`. Use `createDataPartRenderer` with a Standard Schema validator for typed rendering.

For activity entries, include a short text part and a data part such as `{ "type": "tool-call", "toolName": "search" }`. This keeps the event useful to generic clients while allowing custom renderers to enhance it.

## Input Required

Set task status to `input-required` when the agent needs a reply. The next user message is sent to the same task and context. A structured form is an opt-in extension: attach a `DataPart` with `type: "form"`, then read the returned `type: "form-response"` data part.

Keep event payloads bounded. Conversation repositories persist retained events, so large tool outputs should be summarized or made available as a file artifact.
