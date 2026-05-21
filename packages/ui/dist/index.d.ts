import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

type MessageStatusHistoryEntry = {
    id: string;
    label: string;
    at: number;
};
type MessageTimelineEvent = {
    id: string;
    kind: string;
    summary: string;
    details?: string;
    raw?: string;
    rawEvent?: unknown;
    at: number;
};
type MessageTimelineEventRenderer = (event: MessageTimelineEvent) => React.ReactNode;
type Message = {
    id: string;
    role: "user" | "assistant";
    text: string;
    thinkingText?: string;
    status?: string;
    isWorking?: boolean;
    statusHistory?: MessageStatusHistoryEntry[];
    events?: MessageTimelineEvent[];
};

type A2AConversationState = {
    contextId?: string;
    taskId?: string;
};

type PersistedTaskSession = {
    id: string;
    title: string;
    messages: Message[];
    conversationState: A2AConversationState;
    createdAt: number;
    updatedAt: number;
};
type A2AChatPersistenceAdapter = {
    loadSessions: (input: {
        url: string;
    }) => Promise<PersistedTaskSession[]>;
    deleteSession?: (input: {
        url: string;
        sessionId: string;
    }) => Promise<void>;
};

type A2AAgentSuggestion = {
    label: string;
    url: string;
    description?: string;
};
type A2AChatProps = {
    className?: string;
    title?: string;
    description?: string;
    initialUrl?: string;
    proxyBasePath?: string | false;
    autoConnect?: boolean;
    showConnectionForm?: boolean;
    agentSuggestions?: A2AAgentSuggestion[];
    eventRenderers?: MessageTimelineEventRenderer[];
    persistence?: A2AChatPersistenceAdapter;
};
declare function A2AChat(props: A2AChatProps): react_jsx_runtime.JSX.Element;

declare const inspectorEventRenderers: MessageTimelineEventRenderer[];

export { type A2AAgentSuggestion, A2AChat, type A2AChatPersistenceAdapter, type A2AChatProps, type Message, type MessageTimelineEvent, type MessageTimelineEventRenderer, type PersistedTaskSession, inspectorEventRenderers };
