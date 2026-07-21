# Rendering A2A messages, parts & events

This is the contract between an **A2A server (the agent)** and the **`a2a-chat`
UI**. It tells a server builder exactly what to emit so the chat renders images,
files, structured data, live progress, and interactive forms — and what the
client does with each thing it receives.

If you only read one section, read [The mental model](#the-mental-model) and
[Quick reference](#quick-reference).

---

## The mental model

A2A gives the client three kinds of information. `a2a-chat` renders each one
differently:

| A2A concept | What it is | Where it renders |
| --- | --- | --- |
| **Artifacts** (`TaskArtifactUpdateEvent`, `task.artifacts`) | The agent's **outputs** | The assistant message body — text as markdown, files as images/players/downloads, data as structured blocks |
| **Working status messages** (`TaskStatusUpdateEvent` with `state: "working"`) | The agent's **process** — thinking, tool calls, progress | A collapsible **event timeline** above the answer |
| **Input-required status** (`state: "input-required"` / `"auth-required"`) | The agent **asking the user** something | An inline prompt, and an interactive **form** when a form part is attached |

The single rule that drives everything:

> **Artifacts are outputs. Status messages are process. Put your answer in an
> artifact; put your progress in a working status message; ask for input by
> moving the task to `input-required`.**

Text is special-cased: text from artifacts and the final agent message is merged
into one markdown block (so streaming reads naturally). Everything non-text
(files, data) is rendered as discrete blocks after the text.

---

## Quick reference

| You want to… | Emit | Part |
| --- | --- | --- |
| Stream a text answer | `TaskArtifactUpdateEvent` (append chunks, same `artifactId`) | `TextPart` |
| Show an image | `TaskArtifactUpdateEvent` | `FilePart` with `mimeType: "image/*"` |
| Offer a file download | `TaskArtifactUpdateEvent` | `FilePart` (any other `mimeType`) |
| Return structured data | `TaskArtifactUpdateEvent` | `DataPart` |
| Report thinking / tool use | `TaskStatusUpdateEvent` (`working`) | `DataPart` with `type` discriminator |
| Ask a free-text question | `TaskStatusUpdateEvent` (`input-required`) | `TextPart` |
| Ask a structured question | `TaskStatusUpdateEvent` (`input-required`) | `TextPart` + `DataPart` with `type: "form"` |
| Finish | `TaskStatusUpdateEvent` (`completed` / `failed`) | — |

---

## Content parts (the answer)

The assistant message body is built from the parts of the task's **artifacts**
plus the parts of the agent's **history messages**. Each `Part` maps to a
renderer:

### `TextPart` → markdown

```json
{ "kind": "text", "text": "The current EUR/USD rate is **1.08**." }
```

All text parts are concatenated and rendered as GitHub-flavored markdown
(code blocks, tables, math, and mermaid included). Stream it with append chunks:

```json
{
  "artifactUpdate": {
    "taskId": "task-1",
    "artifact": { "artifactId": "answer", "parts": [{ "kind": "text", "text": "The current " }] },
    "append": true
  }
}
```

### `FilePart` → image, audio, video, or download

A file is rendered by its `mimeType`:

- `image/*` → inline `<img>`
- `audio/*` → `<audio controls>`
- `video/*` → `<video controls>`
- anything else → a download card (filename + type)

Provide the bytes inline **or** a URL — either works.

Inline (base64), best for generated images:

```json
{
  "kind": "file",
  "file": {
    "name": "chart.png",
    "mimeType": "image/png",
    "bytes": "iVBORw0KGgoAAAANSUhEUgAA…"
  }
}
```

By reference (URL), best for large or already-hosted files:

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

> `mimeType` drives the rendering. Omit it and the file falls back to a download
> card. URLs must be reachable by the browser (respect CORS / proxy them).

> **Flat file shape also accepted.** Some frameworks (e.g. `fasta2a`) emit file
> parts flat — `{ "raw": "<base64>", "url": "…", "mediaType": "image/png",
> "filename": "x.png" }` with no `kind`/nested `file`. The client maps `raw`→
> bytes, `url`→uri, `mediaType`/`media_type`→mimeType, `filename`→name. Prefer
> the spec shape above for portability.

### `DataPart` → structured block

Any `DataPart` that is **not** a recognized process/control type (see below) is
treated as output content. By default it renders as a formatted JSON block; the
client can register a custom renderer keyed on the data shape.

```json
{
  "kind": "data",
  "data": { "type": "weather", "location": "Berlin", "tempC": 21, "condition": "sunny" }
}
```

Give your data a `type` field so the client can branch on it (see
[Custom renderers](#custom-content-renderers)).

---

## Process events (the timeline)

While the task is `working`, emit `TaskStatusUpdateEvent`s whose status message
carries a `DataPart` with a `type` discriminator. These are **not** shown as the
answer — they populate the collapsible timeline. Recognized types:

| `type` | Meaning | Extra fields |
| --- | --- | --- |
| `thinking` | Reasoning text | `text` |
| `tool-call` | A tool was invoked | `toolName`, `input` (or `args`), `toolCallId` |
| `tool-result` | A tool returned | `toolName`, `output` (or `content`), `toolCallId` |
| `send-task-progress` | A delegated sub-agent task advanced | `taskId`, `state`, `text`, `url` |
| `finish` / `finish-step` | Model step finished | `finishReason` |

```json
{
  "statusUpdate": {
    "taskId": "task-1",
    "status": {
      "state": "working",
      "message": {
        "role": "agent",
        "parts": [
          { "kind": "text", "text": "Searching the web…" },
          {
            "kind": "data",
            "data": {
              "type": "tool-call",
              "toolName": "web_search",
              "toolCallId": "call_1",
              "input": { "query": "EUR/USD rate" }
            }
          }
        ]
      }
    }
  }
}
```

Pair a human-readable `TextPart` with the `DataPart`: clients that understand the
tool schema use the structured part, the rest fall back to the text. Keep
results small — they live in task history; truncate large payloads.

---

## Asking the user (input-required & forms)

Move the task to **`input-required`** (or `auth-required`) with a status message
describing what you need. The client stops the "working" indicator, ends the
turn, and renders the prompt.

### Free-text question

```json
{
  "statusUpdate": {
    "taskId": "task-1",
    "final": true,
    "status": {
      "state": "input-required",
      "message": {
        "role": "agent",
        "parts": [{ "kind": "text", "text": "Which account — savings or checking?" }]
      }
    }
  }
}
```

The user replies through the normal input box. That reply is sent back **to the
same task** (`taskId`) and `contextId`, so your worker resumes the task.

### Structured question (a form)

Attach a `DataPart` with `type: "form"`. The client renders an interactive form
instead of expecting a typed reply.

```json
{
  "statusUpdate": {
    "taskId": "task-1",
    "final": true,
    "status": {
      "state": "input-required",
      "message": {
        "role": "agent",
        "parts": [
          { "kind": "text", "text": "Confirm the transfer details:" },
          {
            "kind": "data",
            "data": {
              "type": "form",
              "id": "transfer-1",
              "title": "Transfer",
              "submitLabel": "Send transfer",
              "fields": [
                { "name": "from", "label": "From account", "type": "select", "required": true,
                  "options": [ { "value": "savings", "label": "Savings" }, { "value": "checking", "label": "Checking" } ] },
                { "name": "amount", "label": "Amount (EUR)", "type": "number", "required": true },
                { "name": "note", "label": "Note", "type": "textarea", "placeholder": "Optional" },
                { "name": "confirm", "label": "I authorize this transfer", "type": "boolean", "required": true }
              ]
            }
          }
        ]
      }
    }
  }
}
```

#### Form field schema

| Field key | Type | Notes |
| --- | --- | --- |
| `name` | string | **Required.** Key the answer is stored under. |
| `label` | string | Display label. Falls back to `name`. |
| `type` | enum | `text` (default), `textarea`, `number`, `email`, `url`, `password`, `date`, `select`, `radio`, `boolean`. |
| `placeholder` | string | Input placeholder / checkbox caption. |
| `description` | string | Helper text under the field. |
| `required` | boolean | Native required validation. |
| `options` | array | For `select` / `radio`: `{ value, label? }` (or a bare string). |
| `defaultValue` | string \| number \| boolean | Pre-filled value. |

Form object: `{ type: "form", fields: [...], id?, title?, description?, submitLabel? }`.

#### What comes back

When the user submits, the client sends a message **to the same task** with two
parts — a human-readable summary and the structured values:

```json
{
  "kind": "message",
  "role": "user",
  "taskId": "task-1",
  "contextId": "ctx-1",
  "parts": [
    { "kind": "text", "text": "From account: Savings\nAmount (EUR): 500\nI authorize this transfer: true" },
    { "kind": "data", "data": { "type": "form-response", "formId": "transfer-1", "values": {
      "from": "savings", "amount": 500, "note": "", "confirm": true
    } } }
  ]
}
```

Read `parts[].data` where `data.type === "form-response"` to get `values`. The
`text` part means agents that ignore the structured part still receive a usable
message. `formId` echoes the form's `id` so you can correlate concurrent forms.

---

## Terminal states

End the turn with a status update:

- `completed` — success. Your final answer should already be in an artifact (or
  the final agent message).
- `failed` — attach a message explaining what went wrong; it renders as the body.
- `canceled` / `rejected` — the turn stops; no answer expected.

---

## Client extension points

Both renderer chains are "first non-null wins" arrays you can prepend to.

### Custom content renderers

Handle a bespoke `DataPart` shape before the JSON fallback:

```tsx
import { A2AMessages, defaultPartRenderers } from "@mokronos/a2a-chat-ui"
import type { A2APartRenderer } from "@mokronos/a2a-chat-ui"

const renderWeather: A2APartRenderer = (part) => {
  if (part.kind !== "data" || part.data.type !== "weather") return null
  return <WeatherCard data={part.data} />
}

<A2AMessages partRenderers={[renderWeather, ...defaultPartRenderers]} />
```

### Custom timeline renderers

Same pattern for process events via the `eventRenderers` prop (see
`inspector-event-renderers.tsx` for the built-in tool/thinking renderers).

### Rendering a form yourself

`<A2AInputRequest>` renders `message.inputRequest`, and `<A2AForm>` renders a
`FormSpec` and reports values. Both are exported if you build a custom layout.

---

## Field notes

- **Stream text, batch the rest.** Per-token `append` artifact chunks are fine;
  files and data usually arrive whole in one event.
- **`taskId` is the thread.** Follow-up messages (replies, form responses) carry
  the original `taskId` + `contextId` so the worker resumes the right task.
- **Keep process data small.** Status-message data lives in history; truncate big
  tool outputs and note it with a `truncated: true` flag.
- **`mimeType` is not optional in practice.** Without it, images and media fall
  back to a plain download card.

See the live demo paths in `apps/server/test-agent/fast.py` (`/image`, `/form`)
for a minimal working server.
