# @mokronos/a2a-chat-ui

Conversation-first React UI for `@mokronos/a2a-react`.

```bash
npm install @mokronos/a2a-chat-ui @mokronos/a2a-react react react-dom
```

Import the scoped stylesheet once:

```tsx
import "@mokronos/a2a-chat-ui/styles.css"
```

## Drop-In Chat

`A2AChat` owns the controller, active conversation, automatic connection, and responsive drawer.

```tsx
import { A2AChat } from "@mokronos/a2a-chat-ui"

export function Chat() {
  return (
    <A2AChat
      target={{ kind: "direct", baseUrl: "https://agent.example" }}
      autoConnect
      fillHeight
    />
  )
}
```

All `A2AChatProvider` options are accepted, including direct, proxy, and caller-provided client targets.
Set `allowDirectUrl={false}` to restrict the connection UI to configured and suggested targets.

## Composition

Composable conversation components require an explicit `conversationId`. Pass a controller directly or render them under `A2AChatProvider`. Use `A2AChatRoot` as the CSS scope boundary.

```tsx
import {
  A2AChatProvider,
  A2AChatRoot,
  A2AInput,
  A2AMessages,
  ConversationList,
} from "@mokronos/a2a-chat-ui"

<A2AChatProvider target={target} autoConnect>
  <A2AChatRoot>
    <ConversationList
      activeConversationId={conversationId}
      onConversationChange={setConversationId}
    />
    <A2AMessages conversationId={conversationId} />
    <A2AInput conversationId={conversationId} />
  </A2AChatRoot>
</A2AChatProvider>
```

## Optional Entries

- `@mokronos/a2a-chat-ui/forms`: explicitly versioned form extension components and `createFormPartRenderer`.
- `@mokronos/a2a-chat-ui/inspector`: opt-in `send_task` and `check_task_status` Part and event renderers.
- `@mokronos/a2a-chat-ui/rich-markdown`: Mermaid, math, CJK, and Shiki-enabled `RichResponse`.

The default entry uses lightweight markdown and generic protocol renderers only.

## Attachments

`A2AInput` supports text, file-only messages, multiple files, and caller-provided `DataPart[]`. The default adapter emits inline base64 `FilePart`s. Use `createUploadAttachmentAdapter` to upload files and emit URI `FilePart`s. Both preserve filename and MIME type and support count, per-file, total-byte, accept, and abort constraints.

## Renderers

Custom `PartRenderer` and `EventRenderer` functions receive the standard protocol value, `Conversation`, `Turn`, and source provenance. Return only `null` or `undefined` to defer. Thrown renderer errors are isolated to that item and fall through to generic defaults.

Answer Parts are projected from bare Message outputs and reconstructed Turn artifacts. Status, history, and streaming chunks remain available to Event renderers in the Activity timeline without duplicating answer content.

Helpers include `createDataPartRenderer`, `createExtensionPartRenderer`, and `createEventRenderer`.

Remote FilePart URIs default to `http`, `https`, `blob`, and `data` schemes. Supply `fileUriResolver` or `createFilePartRenderer` to define a different trust boundary.
