// Preset: batteries-included chat in one component.
export { A2AChat } from "./A2AChat"
export type { A2AChatProps, A2AChatPromptSuggestion } from "./A2AChat"

// Provider + context hook: own the layout, read the state directly.
export { A2AChatProvider, useA2AChat } from "@mokronos/a2a-react"
export type { A2AChatProviderProps } from "@mokronos/a2a-react"

// Composable primitives: arrange these inside an A2AChatProvider.
export { A2AConnectionForm } from "./components/a2a/connection-form"
export type { A2AAgentSuggestion, A2AConnectionFormProps } from "./components/a2a/connection-form"
export { A2AConnectionStatus } from "./components/a2a/connection-status"
export type { A2AConnectionStatusProps } from "./components/a2a/connection-status"
export { A2AConnectionBar } from "./components/a2a/connection-bar"
export type { A2AConnectionBarProps } from "./components/a2a/connection-bar"
export { A2AEmptyState } from "./components/a2a/empty-state"
export type { A2AEmptyStateProps } from "./components/a2a/empty-state"
export { A2AMessages } from "./components/a2a/messages"
export type { A2AMessagesProps, A2AMessagesMaxWidth } from "./components/a2a/messages"
export { A2AInput } from "./components/a2a/input"
export type { A2AInputProps } from "./components/a2a/input"
export { A2AForm } from "./components/a2a/a2a-form"
export type { A2AFormProps, A2AFormValues } from "./components/a2a/a2a-form"
export { A2AInputRequest } from "./components/a2a/input-request"
export type { A2AInputRequestProps } from "./components/a2a/input-request"
export {
  defaultPartRenderers,
  renderDataPart,
  renderFilePart,
  renderPart,
} from "./components/a2a/part-renderers"
export type { A2APartRenderer } from "./components/a2a/part-renderers"
export { A2APromptSuggestion, A2APromptSuggestions } from "./components/a2a/prompt-suggestions"
export type { A2APromptSuggestionProps, A2APromptSuggestionsProps } from "./components/a2a/prompt-suggestions"
export { A2ATaskList } from "./components/a2a/task-list"
export type { A2ATaskListProps } from "./components/a2a/task-list"

// Shared types + helpers.
export { inspectorEventRenderers } from "./components/a2a/inspector-event-renderers"
export type {
  FormField,
  FormFieldOption,
  FormFieldType,
  FormSpec,
  InputRequest,
  Message,
  MessageTimelineEvent,
  MessageStatusHistoryEntry,
  RenderablePart,
} from "@mokronos/a2a-react"
export type {
  MessageTimelineEventRenderer,
} from "./components/shared/message-box"
export type {
  A2AChatPersistenceAdapter,
  PersistedTaskSession,
  UseA2AChatResult,
} from "@mokronos/a2a-react"
