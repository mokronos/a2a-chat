export type MessageStatusHistoryEntry = {
  id: string
  label: string
  at: number
}

export type MessageTimelineEvent = {
  id: string
  kind: string
  summary: string
  details?: string
  raw?: string
  rawEvent?: unknown
  at: number
}

/**
 * A normalized, renderable piece of message/artifact content. This mirrors the
 * A2A `Part` union (text / file / data) but is flattened for the UI: file bytes
 * and URIs sit side by side, and each part carries a stable `id` for React keys.
 *
 * Text parts are intentionally *not* included here — streaming text is merged
 * into {@link Message.text} so it can render as a single markdown block. `parts`
 * carries the non-text output content (images, files, structured data).
 */
export type RenderablePart =
  | {
      id: string
      kind: "file"
      /** Optional file name, e.g. "chart.png". */
      name?: string
      /** MIME type, e.g. "image/png". Drives how the file is rendered. */
      mimeType?: string
      /** A URL pointing at the file's content (mutually exclusive with `bytes`). */
      uri?: string
      /** Base64-encoded file content (mutually exclusive with `uri`). */
      bytes?: string
    }
  | {
      id: string
      kind: "data"
      /** The structured JSON payload from an A2A `DataPart`. */
      data: Record<string, unknown>
    }

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "url"
  | "password"
  | "date"
  | "select"
  | "radio"
  | "boolean"

export type FormFieldOption = {
  value: string
  label?: string
}

export type FormField = {
  /** The key the submitted value is stored under. Required. */
  name: string
  /** Human-readable label. Falls back to `name`. */
  label?: string
  type?: FormFieldType
  placeholder?: string
  description?: string
  required?: boolean
  /** Options for `select` and `radio` fields. */
  options?: FormFieldOption[]
  /** Pre-filled value. */
  defaultValue?: string | number | boolean
}

/**
 * A lightweight form definition an agent can attach to an `input-required`
 * status message (as a `DataPart` with `data.type === "form"`) to collect
 * structured input from the user. See docs/a2a-rendering.md.
 */
export type FormSpec = {
  /** Stable id echoed back in the response so the agent can correlate it. */
  id?: string
  title?: string
  description?: string
  fields: FormField[]
  submitLabel?: string
}

/**
 * Present on an assistant message when the task is waiting on the user
 * (`input-required` / `auth-required`). Carries the agent's prompt and, when
 * provided, a structured {@link FormSpec} to render as a form.
 */
export type InputRequest = {
  /** The task awaiting input; the response is sent back to this task. */
  taskId?: string
  /** Whether it is `input-required` or `auth-required`. */
  reason: "input-required" | "auth-required"
  /** Human-readable prompt text extracted from the status message. */
  text?: string
  /** Optional structured form to render instead of a plain reply box. */
  form?: FormSpec
  /** False once the user has responded to this request. */
  pending: boolean
}

export type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  thinkingText?: string
  status?: string
  isWorking?: boolean
  statusHistory?: MessageStatusHistoryEntry[]
  events?: MessageTimelineEvent[]
  /** Non-text output content (images, files, structured data). */
  parts?: RenderablePart[]
  /** Present while the task waits for structured/free-form user input. */
  inputRequest?: InputRequest
}
