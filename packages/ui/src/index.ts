// Preset: batteries-included chat in one component.
export { A2AChat } from "./A2AChat"
export type { A2AChatProps, A2AChatPromptSuggestion } from "./A2AChat"

// Provider + context hook: own the layout, read the state directly.
export { A2AChatProvider, useA2AChat } from "./a2a/context"
export type { A2AChatProviderProps } from "./a2a/context"

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
export { A2APromptSuggestion, A2APromptSuggestions } from "./components/a2a/prompt-suggestions"
export type { A2APromptSuggestionProps, A2APromptSuggestionsProps } from "./components/a2a/prompt-suggestions"
export { A2ATaskList } from "./components/a2a/task-list"
export type { A2ATaskListProps } from "./components/a2a/task-list"

// Shared types + helpers.
export { inspectorEventRenderers } from "./a2a/inspector-event-renderers"
export type {
  Message,
  MessageTimelineEvent,
  MessageTimelineEventRenderer,
} from "./components/shared/message-box"
export type { UseA2AChatResult } from "./a2a/use-a2a-chat"
export type { A2AChatPersistenceAdapter, PersistedTaskSession } from "./a2a/use-a2a-chat"
