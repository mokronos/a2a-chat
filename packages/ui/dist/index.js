// src/A2AChat.tsx
import React10 from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";

// src/components/shared/input-box.tsx
import "react";
import { ArrowUpIcon } from "lucide-react";

// src/components/ui/button.tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/ui/button.tsx
import { jsx } from "react/jsx-runtime";
var buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    ButtonPrimitive,
    {
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}

// src/components/ui/textarea.tsx
import "react";
import { jsx as jsx2 } from "react/jsx-runtime";
function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsx2(
    "textarea",
    {
      "data-slot": "textarea",
      className: cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      ),
      ...props
    }
  );
}

// src/components/shared/input-box.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function InputBox({ value, onChange, onSubmit, disabled = false }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx3(
      Textarea,
      {
        placeholder: "Write a message...",
        className: "min-h-20 flex-1 resize-none",
        value,
        onChange: (event) => onChange(event.target.value),
        onKeyDown: handleKeyDown,
        disabled
      }
    ),
    /* @__PURE__ */ jsx3(
      Button,
      {
        variant: "outline",
        size: "icon",
        disabled: disabled || value.trim().length === 0,
        "aria-label": "Send message",
        onClick: onSubmit,
        children: /* @__PURE__ */ jsx3(ArrowUpIcon, {})
      }
    )
  ] });
}

// src/components/shared/message-box.tsx
import React4 from "react";
import { ChevronDownIcon } from "lucide-react";

// src/components/ui/spinner.tsx
import "react";
import { jsx as jsx4 } from "react/jsx-runtime";
function Spinner({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "span",
    {
      className: cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className
      ),
      ...props
    }
  );
}

// src/components/shared/message-box.tsx
import { jsx as jsx5, jsxs as jsxs2 } from "react/jsx-runtime";
function formatEventTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}
function renderEventContent(event, eventRenderers) {
  for (const renderEvent of eventRenderers) {
    const rendered = renderEvent(event);
    if (rendered) {
      return rendered;
    }
  }
  return null;
}
function MessageBox({ messages, eventRenderers = [], className }) {
  const containerRef = React4.useRef(null);
  const endRef = React4.useRef(null);
  const [expandedStatusHistory, setExpandedStatusHistory] = React4.useState({});
  React4.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
    const frameId = globalThis.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      endRef.current?.scrollIntoView({ block: "end" });
    });
    return () => {
      globalThis.cancelAnimationFrame(frameId);
    };
  }, [messages]);
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      ref: containerRef,
      className: cn("flex h-72 flex-col gap-3 overflow-auto rounded-md border border-border bg-background p-3", className),
      children: [
        messages.map((message) => {
          const isUser = message.role === "user";
          const statusHistory = message.statusHistory ?? [];
          const timelineEvents = message.events ?? [];
          const isHistoryExpanded = expandedStatusHistory[message.id] === true;
          const canExpandStatusHistory = statusHistory.length > 1;
          return /* @__PURE__ */ jsxs2(
            "div",
            {
              className: isUser ? "ml-8 min-w-0 self-end" : "mr-8 min-w-0 self-start flex flex-col gap-1.5",
              children: [
                !isUser ? /* @__PURE__ */ jsxs2("div", { className: "min-w-0 overflow-hidden rounded-2xl rounded-bl-sm border border-border/60 bg-muted/70", children: [
                  /* @__PURE__ */ jsxs2("div", { className: "inline-flex w-full items-center gap-2 border-b border-border/50 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground", children: [
                    message.isWorking ? /* @__PURE__ */ jsx5(Spinner, { className: "size-3", "aria-hidden": "true" }) : /* @__PURE__ */ jsx5("span", { className: "size-2 rounded-full bg-muted-foreground/60", "aria-hidden": "true" }),
                    /* @__PURE__ */ jsx5("span", { className: "flex-1 truncate", children: message.status ?? "Idle" }),
                    canExpandStatusHistory ? /* @__PURE__ */ jsxs2(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          setExpandedStatusHistory((current) => ({
                            ...current,
                            [message.id]: !isHistoryExpanded
                          }));
                        },
                        className: "inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/70",
                        "aria-label": isHistoryExpanded ? "Collapse status history" : "Expand status history",
                        children: [
                          /* @__PURE__ */ jsx5(ChevronDownIcon, { className: `size-3 transition-transform ${isHistoryExpanded ? "rotate-180" : ""}` }),
                          /* @__PURE__ */ jsx5("span", { children: statusHistory.length })
                        ]
                      }
                    ) : null
                  ] }),
                  canExpandStatusHistory && isHistoryExpanded ? /* @__PURE__ */ jsx5("div", { className: "border-b border-border/40 bg-muted/30 px-2.5 py-1.5", children: /* @__PURE__ */ jsx5("div", { className: "flex flex-col gap-1 text-[11px] text-muted-foreground", children: statusHistory.map((statusItem) => /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx5("span", { className: "font-mono opacity-80", children: formatEventTime(statusItem.at) }),
                    /* @__PURE__ */ jsx5("span", { children: statusItem.label })
                  ] }, statusItem.id)) }) }) : null,
                  timelineEvents.length > 0 ? /* @__PURE__ */ jsxs2("div", { className: "border-b border-border/40 bg-background/50 px-2.5 py-2", children: [
                    /* @__PURE__ */ jsx5("div", { className: "mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground", children: "Event Timeline" }),
                    /* @__PURE__ */ jsx5("div", { className: "flex flex-col gap-1.5", children: timelineEvents.map((eventItem) => {
                      const customContent = renderEventContent(eventItem, eventRenderers);
                      return /* @__PURE__ */ jsxs2("details", { className: "rounded-md border border-border/40 bg-background/70 px-2 py-1", children: [
                        /* @__PURE__ */ jsxs2("summary", { className: "cursor-pointer list-none text-[11px] text-muted-foreground", children: [
                          /* @__PURE__ */ jsx5("span", { className: "font-mono", children: formatEventTime(eventItem.at) }),
                          " ",
                          /* @__PURE__ */ jsx5("span", { className: "font-medium text-foreground", children: eventItem.kind }),
                          " ",
                          /* @__PURE__ */ jsx5("span", { children: eventItem.summary })
                        ] }),
                        eventItem.details ? /* @__PURE__ */ jsx5("div", { className: "mt-1 text-[11px] text-muted-foreground", children: eventItem.details }) : null,
                        customContent ? /* @__PURE__ */ jsx5("div", { className: "mt-1", children: customContent }) : eventItem.raw ? /* @__PURE__ */ jsx5("pre", { className: "mt-1 overflow-x-auto rounded-sm bg-muted/40 p-1 text-[10px] text-muted-foreground", children: eventItem.raw }) : null
                      ] }, eventItem.id);
                    }) })
                  ] }) : null,
                  message.thinkingText && message.thinkingText.trim().length > 0 ? /* @__PURE__ */ jsxs2("div", { className: "border-t border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap [overflow-wrap:anywhere]", children: [
                    /* @__PURE__ */ jsx5("span", { className: "font-medium", children: "Thinking:" }),
                    " ",
                    message.thinkingText
                  ] }) : null,
                  message.text.trim().length > 0 ? /* @__PURE__ */ jsx5("div", { className: "px-3 py-2 text-foreground whitespace-pre-wrap [overflow-wrap:anywhere]", children: message.text }) : null
                ] }) : null,
                isUser && message.text.trim().length > 0 ? /* @__PURE__ */ jsx5(
                  "div",
                  {
                    className: "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground whitespace-pre-wrap [overflow-wrap:anywhere]",
                    children: message.text
                  }
                ) : null
              ]
            },
            message.id
          );
        }),
        /* @__PURE__ */ jsx5("div", { ref: endRef, "aria-hidden": "true" })
      ]
    }
  );
}

// src/components/ui/card.tsx
import "react";
import { jsx as jsx6 } from "react/jsx-runtime";
function Card({
  className,
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card",
      "data-size": size,
      className: cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-lg bg-card py-4 text-xs/relaxed text-card-foreground ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card-title",
      className: cn("text-sm font-medium", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-xs/relaxed text-muted-foreground", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-4 group-data-[size=sm]/card:px-3", className),
      ...props
    }
  );
}

// src/components/ui/input.tsx
import "react";
import { jsx as jsx7 } from "react/jsx-runtime";
function Input({ className, ...props }) {
  return /* @__PURE__ */ jsx7(
    "input",
    {
      "data-slot": "input",
      className: cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/separator.tsx
import "react";
import { jsx as jsx8 } from "react/jsx-runtime";
function Separator({
  className,
  orientation = "horizontal",
  ...props
}) {
  return /* @__PURE__ */ jsx8(
    "div",
    {
      "data-slot": "separator",
      "data-orientation": orientation,
      className: cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      ),
      ...props
    }
  );
}

// src/a2a/use-a2a-chat.ts
import React8 from "react";
import { Effect as Effect2 } from "effect";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// src/a2a/helpers.ts
import { AGENT_CARD_PATH } from "@a2a-js/sdk";
import { Client, JsonRpcTransport } from "@a2a-js/sdk/client";

// src/a2a/proxy.ts
var DEFAULT_PROXY_BASE_PATH = "/api/a2a";
function normalizeProxyBasePath(basePath) {
  const rawPath = (basePath ?? DEFAULT_PROXY_BASE_PATH).trim();
  if (!rawPath.startsWith("/")) {
    return `/${rawPath.replace(/\/+$/, "")}`;
  }
  return rawPath.replace(/\/+$/, "");
}
function createProxyTransport(basePath) {
  if (!basePath) {
    return {
      mode: "direct"
    };
  }
  return {
    mode: "proxy",
    basePath: normalizeProxyBasePath(basePath)
  };
}
function createAgentCardProxyUrl(transport, targetUrl) {
  if (transport.mode === "direct") {
    return targetUrl;
  }
  const params = new URLSearchParams({ target: targetUrl });
  return `${transport.basePath}/agent-card?${params.toString()}`;
}
function createJsonRpcProxyUrl(transport, endpoint) {
  if (transport.mode === "direct") {
    return endpoint;
  }
  const params = new URLSearchParams({ target: endpoint });
  return `${transport.basePath}/jsonrpc?${params.toString()}`;
}

// src/a2a/helpers.ts
var JSON_RPC_TRANSPORT = "JSONRPC";
function createId(prefix) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function normalizeBaseUrl(url) {
  const rawUrl = url.trim();
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`;
  return withProtocol.replace(/\/$/, "");
}
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function resolveEndpointUrl(baseUrl, url) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(url, normalizedBaseUrl).toString();
}
function resolveJsonRpcEndpoint(baseUrl, agentCard) {
  if (!isRecord(agentCard)) {
    return baseUrl;
  }
  const card = agentCard;
  const interfaces = [
    ...Array.isArray(card.supportedInterfaces) ? card.supportedInterfaces : [],
    ...Array.isArray(card.additionalInterfaces) ? card.additionalInterfaces : []
  ];
  for (const item of interfaces) {
    if (!isRecord(item) || typeof item.url !== "string") {
      continue;
    }
    const binding = typeof item.transport === "string" ? item.transport : typeof item.protocolBinding === "string" ? item.protocolBinding : null;
    if (binding !== JSON_RPC_TRANSPORT) {
      continue;
    }
    return resolveEndpointUrl(baseUrl, item.url);
  }
  if (typeof card.url === "string" && card.url.length > 0) {
    return resolveEndpointUrl(baseUrl, card.url);
  }
  return baseUrl;
}
async function createJsonRpcClient(baseUrl, transport) {
  const cardUrl = transport.mode === "proxy" ? createAgentCardProxyUrl(transport, baseUrl) : `${normalizeBaseUrl(baseUrl)}/${AGENT_CARD_PATH}`;
  const cardResponse = await fetch(cardUrl);
  if (!cardResponse.ok) {
    throw new Error(`Could not fetch agent card (${cardResponse.status})`);
  }
  const agentCard = await cardResponse.json();
  const upstreamEndpoint = resolveJsonRpcEndpoint(baseUrl, agentCard);
  const endpoint = transport.mode === "proxy" ? createJsonRpcProxyUrl(transport, upstreamEndpoint) : baseUrl;
  const client = new Client(new JsonRpcTransport({ endpoint }), agentCard);
  const agentName = typeof agentCard.name === "string" ? agentCard.name : null;
  const acceptedOutputModes = Array.isArray(agentCard.defaultOutputModes) ? agentCard.defaultOutputModes.filter(
    (mode) => typeof mode === "string" && mode.length > 0
  ) : [];
  return { client, agentName, endpoint, acceptedOutputModes };
}
function buildA2AMessage(text, conversationState) {
  return {
    kind: "message",
    messageId: createId("msg"),
    role: "user",
    parts: [{ kind: "text", text }],
    contextId: conversationState.contextId
  };
}
function extractTextFromParts(parts) {
  if (!Array.isArray(parts)) {
    return [];
  }
  return parts.flatMap((part) => {
    if (!isRecord(part)) {
      return [];
    }
    if (part.kind === "text" && typeof part.text === "string" && part.text.trim().length > 0) {
      return [part.text];
    }
    if (typeof part.kind === "undefined" && typeof part.text === "string" && part.text.trim().length > 0) {
      return [part.text];
    }
    if (part.part_kind === "text" && typeof part.content === "string" && part.content.trim().length > 0) {
      return [part.content];
    }
    return [];
  });
}
function getTaskText(task, streamNotes = []) {
  const statusNotes = task.status.message && Array.isArray(task.status.message.parts) ? extractTextFromParts(task.status.message.parts) : [];
  const historyNotes = task.history?.flatMap(
    (message) => message.role === "agent" ? extractTextFromParts(message.parts) : []
  ) ?? [];
  const fragments = [
    ...statusNotes,
    ...historyNotes,
    ...streamNotes
  ].map((fragment) => fragment.trim()).filter((fragment) => fragment.length > 0);
  return Array.from(new Set(fragments)).join("\n\n");
}
function extractTask(value) {
  const normalizeTask = (candidate) => {
    const directState = isRecord(candidate.status) && typeof candidate.status.state === "string" ? candidate.status.state : null;
    if (typeof candidate.id !== "string" || !directState) {
      return null;
    }
    const contextId = typeof candidate.contextId === "string" ? candidate.contextId : typeof candidate.context_id === "string" ? candidate.context_id : void 0;
    const taskCandidate = candidate;
    if (typeof contextId !== "string") {
      return taskCandidate;
    }
    return {
      ...taskCandidate,
      contextId
    };
  };
  if (!isRecord(value)) {
    return null;
  }
  const directTask = normalizeTask(value);
  if (directTask) {
    return directTask;
  }
  const nested = value.task;
  if (isRecord(nested)) {
    const nestedTask = normalizeTask(nested);
    if (nestedTask) {
      return nestedTask;
    }
  }
  const result = value.result;
  if (isRecord(result)) {
    const directResultTask = normalizeTask(result);
    if (directResultTask) {
      return directResultTask;
    }
    const nestedResultTask = result.task;
    if (isRecord(nestedResultTask)) {
      const normalizedNestedResultTask = normalizeTask(nestedResultTask);
      if (normalizedNestedResultTask) {
        return normalizedNestedResultTask;
      }
    }
  }
  return null;
}

// src/a2a/service.ts
import { Effect } from "effect";
var connectJsonRpc = (baseUrl, transport) => Effect.tryPromise({
  try: () => createJsonRpcClient(baseUrl, transport),
  catch: (cause) => cause instanceof Error ? cause : new Error("Could not connect to the A2A server")
});
var sendTaskMessageStream = (client, params, signal) => Effect.sync(() => client.sendMessageStream(params, { signal }));
var resubscribeToTask = (client, taskId, signal) => Effect.sync(() => client.resubscribeTask({ id: taskId }, { signal }));
var getTaskById = (client, taskId) => Effect.tryPromise({
  try: () => client.getTask({ id: taskId }),
  catch: (cause) => cause instanceof Error ? cause : new Error("Could not fetch task from A2A server")
});

// src/a2a/use-a2a-chat.ts
var connectionKey = ["a2a", "connection"];
var chatKey = ["a2a", "chat"];
var TERMINAL_STATES = /* @__PURE__ */ new Set(["completed", "failed", "canceled", "rejected"]);
var DEFAULT_TASK_TITLE = "New Task";
function isTerminalTask(task) {
  return TERMINAL_STATES.has(task.status.state);
}
function formatTaskStatus(status) {
  return status.split(/[-_\s]+/).filter((token) => token.length > 0).map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join(" ");
}
function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return fallback;
}
function extractResponseMessageText(response) {
  if (isRecord(response) && Array.isArray(response.parts)) {
    return extractTextFromParts(response.parts).join("\n");
  }
  if (isRecord(response) && isRecord(response.result) && Array.isArray(response.result.parts)) {
    return extractTextFromParts(response.result.parts).join("\n");
  }
  return "";
}
function normalizeStreamEvent(event) {
  if (!isRecord(event)) {
    return event;
  }
  if (isRecord(event.task)) {
    return event.task;
  }
  if (isRecord(event.statusUpdate)) {
    return {
      kind: "status-update",
      ...event.statusUpdate
    };
  }
  if (isRecord(event.artifactUpdate)) {
    return {
      kind: "artifact-update",
      ...event.artifactUpdate
    };
  }
  return event;
}
function getStatusUpdateEvent(event) {
  const normalized = normalizeStreamEvent(event);
  if (!isRecord(normalized) || normalized.kind !== "status-update" || !isRecord(normalized.status)) {
    return null;
  }
  return {
    kind: "status-update",
    taskId: typeof normalized.taskId === "string" ? normalized.taskId : typeof normalized.task_id === "string" ? normalized.task_id : void 0,
    status: normalized.status
  };
}
function getArtifactUpdateEvent(event) {
  const normalized = normalizeStreamEvent(event);
  if (!isRecord(normalized) || normalized.kind !== "artifact-update") {
    return null;
  }
  return {
    kind: "artifact-update",
    taskId: typeof normalized.taskId === "string" ? normalized.taskId : typeof normalized.task_id === "string" ? normalized.task_id : void 0,
    artifact: isRecord(normalized.artifact) ? {
      parts: normalized.artifact.parts
    } : void 0,
    lastChunk: normalized.lastChunk === true
  };
}
function extractAssistantTextFromArtifactUpdate(event) {
  const parts = event.artifact?.parts;
  const fragments = extractTextFromParts(parts);
  const outputChunks = [];
  let outputSnapshot = null;
  const thinkingChunks = [];
  for (const fragment of fragments) {
    const payload = fragment.trim();
    if (payload.length === 0) {
      continue;
    }
    try {
      const parsed = JSON.parse(payload);
      if (!isRecord(parsed)) {
        continue;
      }
      if (parsed.event_kind === "agent_run_result" && typeof parsed.output === "string") {
        outputSnapshot = parsed.output;
        continue;
      }
      if (parsed.event_kind === "part_end" && isRecord(parsed.part)) {
        if (parsed.part.part_kind === "text" && typeof parsed.part.content === "string") {
          outputChunks.push(parsed.part.content);
          continue;
        }
        if (parsed.part.part_kind === "thinking" && typeof parsed.part.content === "string") {
          thinkingChunks.push(parsed.part.content);
        }
      }
    } catch {
      outputChunks.push(fragment);
    }
  }
  return {
    outputChunks,
    outputSnapshot,
    thinkingChunks
  };
}
function getConnectionInitialState() {
  return {
    state: "idle",
    message: "Not connected",
    client: null,
    connectedUrl: null,
    pendingUrl: null,
    acceptedOutputModes: ["application/json"],
    agentName: null
  };
}
function createTaskSession(title = DEFAULT_TASK_TITLE) {
  const now = Date.now();
  return {
    id: createId("task"),
    title,
    messages: [],
    conversationState: {},
    createdAt: now,
    updatedAt: now
  };
}
function getUrlChatInitialState() {
  const firstSession = createTaskSession();
  return {
    activeSessionId: firstSession.id,
    sessions: [firstSession],
    agentName: null,
    lastConnectedAt: null
  };
}
function getChatInitialState() {
  return {
    byUrl: {}
  };
}
function createResubscribeSignal(controller, timeoutMs) {
  const timeoutController = new AbortController();
  const timeoutId = globalThis.setTimeout(() => timeoutController.abort(), timeoutMs);
  const onAbort = () => timeoutController.abort();
  controller.signal.addEventListener("abort", onAbort, { once: true });
  return {
    signal: timeoutController.signal,
    release: () => {
      globalThis.clearTimeout(timeoutId);
      controller.signal.removeEventListener("abort", onAbort);
    }
  };
}
function getSessionTitleFromText(text) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    return DEFAULT_TASK_TITLE;
  }
  return normalized.length > 36 ? `${normalized.slice(0, 33)}...` : normalized;
}
function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}
function safeSerialize(value) {
  try {
    const serialized = JSON.stringify(value, null, 2);
    return truncateText(serialized, 4e3);
  } catch {
    return void 0;
  }
}
function summarizeArtifactParts(parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return { summary: "No artifact parts in update." };
  }
  const fragments = [];
  for (const part of parts) {
    if (!isRecord(part) || typeof part.kind !== "string") {
      continue;
    }
    if (part.kind === "text") {
      const value = typeof part.text === "string" ? part.text.trim() : "";
      fragments.push(value.length > 0 ? `text: ${truncateText(value, 80)}` : "text: [empty]");
      continue;
    }
    if (part.kind === "data") {
      const value = safeSerialize(part.data);
      fragments.push(value ? `data: ${truncateText(value.replace(/\s+/g, " "), 80)}` : "data");
      continue;
    }
    if (part.kind === "file") {
      const fileName = isRecord(part.file) && typeof part.file.name === "string" ? part.file.name : "file";
      fragments.push(`file: ${fileName}`);
      continue;
    }
    fragments.push(`part: ${part.kind}`);
  }
  if (fragments.length === 0) {
    return { summary: `${parts.length} part(s)` };
  }
  const summary = truncateText(fragments.join(" | "), 180);
  return {
    summary,
    details: `parts: ${parts.length}`
  };
}
function getFirstDataPart(parts) {
  if (!Array.isArray(parts)) {
    return null;
  }
  for (const part of parts) {
    if (isRecord(part) && part.kind === "data" && isRecord(part.data)) {
      return part.data;
    }
  }
  return null;
}
function summarizeStatusUpdateEvent(event) {
  if (!isRecord(event.status) || !isRecord(event.status.message)) {
    return null;
  }
  const data = getFirstDataPart(event.status.message.parts);
  if (!data || typeof data.type !== "string") {
    return null;
  }
  return summarizeToolData(data);
}
function getLatestAgentDataPartFromTask(task) {
  const history = Array.isArray(task.history) ? task.history : [];
  for (const message of [...history].reverse()) {
    if (!isRecord(message) || message.role !== "agent") {
      continue;
    }
    const data = getFirstDataPart(message.parts);
    if (data) {
      return data;
    }
  }
  return null;
}
function summarizeToolData(data) {
  if (typeof data.type !== "string") {
    return null;
  }
  const toolName = typeof data.toolName === "string" ? data.toolName : "tool";
  if (data.type === "tool-call") {
    return `Calling ${toolName}.`;
  }
  if (data.type === "tool-result") {
    return `Received ${toolName} result.`;
  }
  if (data.type === "finish-step" && typeof data.finishReason === "string") {
    return `Finished model step: ${data.finishReason}.`;
  }
  if (data.type === "finish" && typeof data.finishReason === "string") {
    return `Finished run: ${data.finishReason}.`;
  }
  return null;
}
function buildTimelineEvent(event) {
  const normalizedEvent = normalizeStreamEvent(event);
  const raw = safeSerialize(normalizedEvent);
  const task = extractTask(normalizedEvent);
  if (task) {
    const state = formatTaskStatus(task.status.state);
    const taskSummary = summarizeToolData(getLatestAgentDataPartFromTask(task) ?? {});
    return {
      kind: "task-update",
      summary: taskSummary ?? `Task ${task.id} is ${state}.`,
      details: task.contextId ? `contextId: ${task.contextId}` : void 0,
      raw,
      rawEvent: normalizedEvent
    };
  }
  if (isRecord(normalizedEvent) && typeof normalizedEvent.kind === "string") {
    if (normalizedEvent.kind === "status-update") {
      const statusState = isRecord(normalizedEvent.status) && typeof normalizedEvent.status.state === "string" ? formatTaskStatus(normalizedEvent.status.state) : "Unknown";
      const statusSummary = summarizeStatusUpdateEvent(normalizedEvent);
      return {
        kind: "status-update",
        summary: statusSummary ?? `Status changed to ${statusState}.`,
        details: typeof normalizedEvent.taskId === "string" ? `taskId: ${normalizedEvent.taskId}` : void 0,
        raw,
        rawEvent: normalizedEvent
      };
    }
    if (normalizedEvent.kind === "artifact-update") {
      const parts = isRecord(normalizedEvent.artifact) && Array.isArray(normalizedEvent.artifact.parts) ? normalizedEvent.artifact.parts : [];
      const artifactSummary = summarizeArtifactParts(parts);
      return {
        kind: "artifact-update",
        summary: artifactSummary.summary,
        details: artifactSummary.details,
        raw,
        rawEvent: normalizedEvent
      };
    }
    return {
      kind: normalizedEvent.kind,
      summary: "Received event payload.",
      raw,
      rawEvent: normalizedEvent
    };
  }
  return {
    kind: "event",
    summary: "Received event payload.",
    raw,
    rawEvent: normalizedEvent
  };
}
function createStatusEntry(label) {
  return {
    id: createId("status"),
    label,
    at: Date.now()
  };
}
function useA2AChat(options = {}) {
  const {
    initialUrl = "http://localhost:8000",
    proxyBasePath,
    autoConnect = false,
    persistence
  } = options;
  const queryClient = useQueryClient();
  const [url, setUrl] = React8.useState(initialUrl);
  const [taskInput, setTaskInput] = React8.useState("");
  const runnerControllersRef = React8.useRef(/* @__PURE__ */ new Map());
  const didAutoConnectRef = React8.useRef(/* @__PURE__ */ new Set());
  const baseUrl = React8.useMemo(() => normalizeBaseUrl(url), [url]);
  const transport = React8.useMemo(() => createProxyTransport(proxyBasePath), [proxyBasePath]);
  const connectionQuery = useQuery({
    queryKey: connectionKey,
    queryFn: async () => getConnectionInitialState(),
    initialData: getConnectionInitialState,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY
  });
  const chatQuery = useQuery({
    queryKey: chatKey,
    queryFn: async () => getChatInitialState(),
    initialData: getChatInitialState,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY
  });
  const setConnectionStore = React8.useCallback(
    (updater) => {
      queryClient.setQueryData(
        connectionKey,
        (current) => updater(current ?? getConnectionInitialState())
      );
    },
    [queryClient]
  );
  const setChatStore = React8.useCallback(
    (updater) => {
      queryClient.setQueryData(chatKey, (current) => updater(current ?? getChatInitialState()));
    },
    [queryClient]
  );
  const ensureUrlChatState = React8.useCallback(
    (urlKey) => {
      setChatStore((current) => {
        if (current.byUrl[urlKey]) {
          return current;
        }
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: getUrlChatInitialState()
          }
        };
      });
    },
    [setChatStore]
  );
  const updateTaskSession = React8.useCallback(
    (urlKey, sessionId, updater) => {
      setChatStore((current) => {
        const urlState = current.byUrl[urlKey];
        if (!urlState) {
          return current;
        }
        let didUpdate = false;
        const nextSessions = urlState.sessions.map((session) => {
          if (session.id !== sessionId) {
            return session;
          }
          didUpdate = true;
          const updatedSession = updater(session);
          if (updatedSession.updatedAt === session.updatedAt) {
            return {
              ...updatedSession,
              updatedAt: Date.now()
            };
          }
          return updatedSession;
        });
        if (!didUpdate) {
          return current;
        }
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: {
              ...urlState,
              sessions: nextSessions
            }
          }
        };
      });
    },
    [setChatStore]
  );
  const hydratePersistedSessions = React8.useCallback(
    async (urlKey) => {
      if (!persistence) {
        return;
      }
      const persistedSessions = await persistence.loadSessions({ url: urlKey });
      if (persistedSessions.length === 0) {
        ensureUrlChatState(urlKey);
        return;
      }
      setChatStore((current) => {
        const urlState = current.byUrl[urlKey] ?? getUrlChatInitialState();
        const existingById = new Map(urlState.sessions.map((session) => [session.id, session]));
        const nextSessions = persistedSessions.map((session) => ({
          ...existingById.get(session.id) ?? {},
          ...session
        }));
        const activeSessionId = nextSessions.some((session) => session.id === urlState.activeSessionId) ? urlState.activeSessionId : nextSessions[0]?.id ?? urlState.activeSessionId;
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: {
              ...urlState,
              activeSessionId,
              sessions: nextSessions
            }
          }
        };
      });
    },
    [ensureUrlChatState, persistence, setChatStore]
  );
  const updateAssistantMessage = React8.useCallback(
    (urlKey, sessionId, messageId, updater) => {
      updateTaskSession(urlKey, sessionId, (currentSession) => ({
        ...currentSession,
        messages: currentSession.messages.map((item) => {
          if (item.id !== messageId || item.role !== "assistant") {
            return item;
          }
          return updater(item);
        })
      }));
    },
    [updateTaskSession]
  );
  const setAssistantStatus = React8.useCallback(
    (urlKey, sessionId, messageId, nextStatus, isWorking) => {
      updateAssistantMessage(urlKey, sessionId, messageId, (currentMessage) => {
        const statusHistory = currentMessage.statusHistory ?? [];
        const lastStatus = statusHistory.at(-1)?.label;
        const nextStatusHistory = lastStatus === nextStatus ? statusHistory : [...statusHistory, createStatusEntry(nextStatus)];
        return {
          ...currentMessage,
          status: nextStatus,
          isWorking,
          statusHistory: nextStatusHistory
        };
      });
    },
    [updateAssistantMessage]
  );
  const appendAssistantEvent = React8.useCallback(
    (urlKey, sessionId, messageId, event) => {
      updateAssistantMessage(urlKey, sessionId, messageId, (currentMessage) => ({
        ...currentMessage,
        events: [
          ...currentMessage.events ?? [],
          {
            ...event,
            id: createId("evt"),
            at: Date.now()
          }
        ]
      }));
    },
    [updateAssistantMessage]
  );
  const hydrateTaskOutput = React8.useCallback(
    async (client, urlKey, sessionId, assistantMessageId, taskId) => {
      try {
        const snapshot = await Effect2.runPromise(getTaskById(client, taskId));
        const snapshotText = getTaskText(snapshot);
        appendAssistantEvent(urlKey, sessionId, assistantMessageId, {
          kind: "task-snapshot",
          summary: "Fetched final task snapshot.",
          raw: safeSerialize(snapshot),
          rawEvent: snapshot
        });
        if (snapshotText.length > 0) {
          updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
            ...currentMessage,
            text: snapshotText
          }));
        }
        return snapshot;
      } catch (error) {
        appendAssistantEvent(urlKey, sessionId, assistantMessageId, {
          kind: "task-snapshot-error",
          summary: getErrorMessage(error, "Could not fetch final task snapshot.")
        });
        return null;
      }
    },
    [appendAssistantEvent, updateAssistantMessage]
  );
  const processTaskStreamEvent = React8.useCallback(
    async (client, urlKey, sessionId, assistantMessageId, currentTask, event) => {
      const artifactUpdate = getArtifactUpdateEvent(event);
      if (!artifactUpdate) {
        appendAssistantEvent(urlKey, sessionId, assistantMessageId, buildTimelineEvent(event));
      }
      const taskEvent = extractTask(normalizeStreamEvent(event));
      if (taskEvent) {
        updateTaskSession(urlKey, sessionId, (currentSession) => ({
          ...currentSession,
          conversationState: {
            contextId: taskEvent.contextId,
            taskId: taskEvent.id
          }
        }));
        updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
          ...currentMessage,
          text: getTaskText(taskEvent)
        }));
        setAssistantStatus(
          urlKey,
          sessionId,
          assistantMessageId,
          formatTaskStatus(taskEvent.status.state),
          !isTerminalTask(taskEvent)
        );
        if (isTerminalTask(taskEvent)) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            taskEvent.id
          );
          return { task: snapshot ?? taskEvent, done: true };
        }
        return { task: taskEvent, done: false };
      }
      if (!currentTask) {
        return { task: null, done: false };
      }
      if (artifactUpdate && artifactUpdate.taskId === currentTask.id) {
        const { outputChunks, outputSnapshot, thinkingChunks } = extractAssistantTextFromArtifactUpdate(artifactUpdate);
        if (outputSnapshot !== null || outputChunks.length > 0 || thinkingChunks.length > 0) {
          updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => {
            const nextText = outputSnapshot ?? `${currentMessage.text}${outputChunks.join("")}`;
            const nextThinkingText = `${currentMessage.thinkingText ?? ""}${thinkingChunks.join("")}`;
            return {
              ...currentMessage,
              text: nextText,
              thinkingText: nextThinkingText.length > 0 ? nextThinkingText : currentMessage.thinkingText
            };
          });
        }
        if (artifactUpdate.lastChunk) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            currentTask.id
          );
          if (snapshot) {
            setAssistantStatus(
              urlKey,
              sessionId,
              assistantMessageId,
              formatTaskStatus(snapshot.status.state),
              !isTerminalTask(snapshot)
            );
            return { task: snapshot, done: isTerminalTask(snapshot) };
          }
        }
        return { task: currentTask, done: false };
      }
      const statusUpdate = getStatusUpdateEvent(event);
      if (statusUpdate && statusUpdate.taskId === currentTask.id) {
        const nextTask = {
          ...currentTask,
          status: statusUpdate.status
        };
        updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
          ...currentMessage,
          text: getTaskText(nextTask)
        }));
        setAssistantStatus(
          urlKey,
          sessionId,
          assistantMessageId,
          formatTaskStatus(nextTask.status.state),
          !isTerminalTask(nextTask)
        );
        if (isTerminalTask(nextTask)) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            nextTask.id
          );
          return { task: snapshot ?? nextTask, done: true };
        }
        return { task: nextTask, done: false };
      }
      return { task: currentTask, done: false };
    },
    [
      appendAssistantEvent,
      hydrateTaskOutput,
      setAssistantStatus,
      updateAssistantMessage,
      updateTaskSession
    ]
  );
  const startTaskResubscribeLoop = React8.useCallback(
    (client, urlKey, sessionId, initialTask, assistantMessageId) => {
      const controllerKey = `${urlKey}::${initialTask.id}`;
      const existing = runnerControllersRef.current.get(controllerKey);
      if (existing) {
        existing.abort();
      }
      const controller = new AbortController();
      runnerControllersRef.current.set(controllerKey, controller);
      void (async () => {
        let currentTask = initialTask;
        for (let attempt = 0; attempt < 120; attempt += 1) {
          if (controller.signal.aborted || isTerminalTask(currentTask)) {
            break;
          }
          const { signal, release } = createResubscribeSignal(controller, 3e3);
          try {
            const stream = await Effect2.runPromise(resubscribeToTask(client, currentTask.id, signal));
            for await (const event of stream) {
              if (controller.signal.aborted) {
                break;
              }
              const result = await processTaskStreamEvent(
                client,
                urlKey,
                sessionId,
                assistantMessageId,
                currentTask,
                event
              );
              if (result.task) {
                currentTask = result.task;
              }
              if (result.done) {
                break;
              }
            }
          } catch {
          } finally {
            release();
          }
          if (controller.signal.aborted || isTerminalTask(currentTask)) {
            break;
          }
          await Effect2.runPromise(Effect2.sleep(600));
        }
        if (!controller.signal.aborted && !isTerminalTask(currentTask)) {
          setAssistantStatus(urlKey, sessionId, assistantMessageId, "Waiting For Events", true);
        }
        runnerControllersRef.current.delete(controllerKey);
      })();
    },
    [processTaskStreamEvent, setAssistantStatus]
  );
  React8.useEffect(() => {
    return () => {
      for (const controller of runnerControllersRef.current.values()) {
        controller.abort();
      }
      runnerControllersRef.current.clear();
    };
  }, []);
  const connectMutation = useMutation({
    mutationFn: async (targetUrl) => Effect2.runPromise(connectJsonRpc(targetUrl, transport)),
    onMutate: (targetUrl) => {
      ensureUrlChatState(targetUrl);
      setConnectionStore((current) => ({
        ...current,
        state: "connecting",
        message: `Checking ${targetUrl}...`,
        client: null,
        connectedUrl: null,
        pendingUrl: targetUrl,
        acceptedOutputModes: ["application/json"],
        agentName: null
      }));
    },
    onSuccess: ({ client, endpoint, acceptedOutputModes, agentName }, targetUrl) => {
      setChatStore((current) => {
        const urlState = current.byUrl[targetUrl] ?? getUrlChatInitialState();
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [targetUrl]: {
              ...urlState,
              agentName: agentName && agentName.trim().length > 0 ? agentName.trim() : null,
              lastConnectedAt: Date.now()
            }
          }
        };
      });
      setConnectionStore((current) => ({
        ...current,
        state: "connected",
        message: `Connected via JSONRPC (${endpoint})`,
        client,
        connectedUrl: targetUrl,
        pendingUrl: null,
        acceptedOutputModes: acceptedOutputModes.length > 0 ? acceptedOutputModes : ["application/json"],
        agentName
      }));
      void hydratePersistedSessions(targetUrl);
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Could not connect to the server");
      setConnectionStore((current) => ({
        ...current,
        state: "error",
        message,
        client: null,
        connectedUrl: null,
        pendingUrl: current.pendingUrl,
        agentName: null
      }));
    }
  });
  const sendTaskMutation = useMutation({
    mutationFn: async (variables) => {
      const connection = queryClient.getQueryData(connectionKey);
      if (!connection || connection.state !== "connected" || !connection.client || connection.connectedUrl !== variables.urlKey) {
        throw new Error("Not connected");
      }
      const chatStore = queryClient.getQueryData(chatKey) ?? getChatInitialState();
      const urlState = chatStore.byUrl[variables.urlKey];
      const targetSession = urlState?.sessions.find((session) => session.id === variables.taskSessionId);
      if (!targetSession) {
        throw new Error("Task session not found");
      }
      const streamController = new AbortController();
      const streamControllerKey = `${variables.urlKey}::${variables.assistantMessageId}`;
      runnerControllersRef.current.set(streamControllerKey, streamController);
      let currentTask = null;
      let directResponseText = "";
      try {
        const payload = buildA2AMessage(variables.taskText, targetSession.conversationState);
        const stream = await Effect2.runPromise(
          sendTaskMessageStream(
            connection.client,
            {
              message: payload,
              configuration: {
                acceptedOutputModes: connection.acceptedOutputModes
              }
            },
            streamController.signal
          )
        );
        for await (const event of stream) {
          if (streamController.signal.aborted) {
            break;
          }
          const eventText = extractResponseMessageText(event);
          if (eventText.length > 0) {
            directResponseText = eventText;
          }
          const result = await processTaskStreamEvent(
            connection.client,
            variables.urlKey,
            variables.taskSessionId,
            variables.assistantMessageId,
            currentTask,
            event
          );
          currentTask = result.task;
          if (currentTask && runnerControllersRef.current.get(streamControllerKey) === streamController) {
            runnerControllersRef.current.delete(streamControllerKey);
            runnerControllersRef.current.set(`${variables.urlKey}::${currentTask.id}`, streamController);
          }
          if (result.done) {
            break;
          }
        }
      } catch (error) {
        if (!streamController.signal.aborted && currentTask && !isTerminalTask(currentTask)) {
          startTaskResubscribeLoop(
            connection.client,
            variables.urlKey,
            variables.taskSessionId,
            currentTask,
            variables.assistantMessageId
          );
          return;
        }
        throw error;
      } finally {
        if (runnerControllersRef.current.get(streamControllerKey) === streamController) {
          runnerControllersRef.current.delete(streamControllerKey);
        }
        if (currentTask && runnerControllersRef.current.get(`${variables.urlKey}::${currentTask.id}`) === streamController) {
          runnerControllersRef.current.delete(`${variables.urlKey}::${currentTask.id}`);
        }
      }
      if (currentTask) {
        return;
      }
      if (directResponseText.length > 0) {
        updateAssistantMessage(
          variables.urlKey,
          variables.taskSessionId,
          variables.assistantMessageId,
          (currentMessage) => ({
            ...currentMessage,
            text: directResponseText
          })
        );
        setAssistantStatus(
          variables.urlKey,
          variables.taskSessionId,
          variables.assistantMessageId,
          "Completed",
          false
        );
        return;
      }
      throw new Error("Task stream ended without returning a task or message.");
    },
    onSuccess: async (_result, variables) => {
      await hydratePersistedSessions(variables.urlKey);
    },
    onMutate: ({ taskText, assistantMessageId, urlKey, taskSessionId }) => {
      updateTaskSession(urlKey, taskSessionId, (currentSession) => ({
        ...currentSession,
        title: currentSession.title === DEFAULT_TASK_TITLE && currentSession.messages.length === 0 ? getSessionTitleFromText(taskText) : currentSession.title,
        messages: [
          ...currentSession.messages,
          { id: createId("msg"), role: "user", text: taskText },
          {
            id: assistantMessageId,
            role: "assistant",
            text: "",
            status: "Sending Task",
            isWorking: true,
            statusHistory: [createStatusEntry("Sending Task")],
            events: []
          }
        ]
      }));
      setTaskInput("");
    },
    onError: (error, variables) => {
      const message = getErrorMessage(
        error,
        "Failed to send task or read task updates from the server."
      );
      updateAssistantMessage(
        variables.urlKey,
        variables.taskSessionId,
        variables.assistantMessageId,
        (currentMessage) => ({
          ...currentMessage,
          text: message
        })
      );
      setAssistantStatus(
        variables.urlKey,
        variables.taskSessionId,
        variables.assistantMessageId,
        "Failed",
        false
      );
    }
  });
  const activeUrlState = chatQuery.data.byUrl[baseUrl] ?? null;
  const recentAgents = React8.useMemo(
    () => Object.entries(chatQuery.data.byUrl).map(([connectedUrl, state]) => ({
      url: connectedUrl,
      agentName: state.agentName,
      lastConnectedAt: state.lastConnectedAt
    })).filter((entry) => entry.lastConnectedAt !== null).sort((a, b) => (b.lastConnectedAt ?? 0) - (a.lastConnectedAt ?? 0)),
    [chatQuery.data.byUrl]
  );
  const activeTaskSession = activeUrlState ? activeUrlState.sessions.find((session) => session.id === activeUrlState.activeSessionId) ?? activeUrlState.sessions[0] ?? null : null;
  const taskSessions = React8.useMemo(
    () => [...activeUrlState?.sessions ?? []].sort((a, b) => b.updatedAt - a.updatedAt).map((session) => ({
      id: session.id,
      title: session.title,
      updatedAt: session.updatedAt
    })),
    [activeUrlState?.sessions]
  );
  const handleConnect = React8.useCallback(() => {
    connectMutation.mutate(baseUrl);
  }, [baseUrl, connectMutation]);
  const handleSelectRecentAgent = React8.useCallback(
    (agentUrl) => {
      setUrl(agentUrl);
      ensureUrlChatState(agentUrl);
    },
    [ensureUrlChatState]
  );
  React8.useEffect(() => {
    if (!autoConnect || connectMutation.isPending || didAutoConnectRef.current.has(baseUrl)) {
      return;
    }
    const connection = connectionQuery.data;
    if (connection.state === "connected" && connection.connectedUrl === baseUrl) {
      return;
    }
    didAutoConnectRef.current.add(baseUrl);
    connectMutation.mutate(baseUrl);
  }, [autoConnect, baseUrl, connectMutation, connectionQuery.data]);
  React8.useEffect(() => {
    void hydratePersistedSessions(baseUrl);
  }, [baseUrl, hydratePersistedSessions]);
  const handleSubmitTask = React8.useCallback(() => {
    const taskText = taskInput.trim();
    const connection = connectionQuery.data;
    if (taskText.length === 0 || sendTaskMutation.isPending || !activeTaskSession || connection.state !== "connected" || connection.connectedUrl !== baseUrl || !connection.client) {
      return;
    }
    sendTaskMutation.mutate({
      taskText,
      assistantMessageId: createId("msg"),
      urlKey: baseUrl,
      taskSessionId: activeTaskSession.id
    });
  }, [activeTaskSession, baseUrl, connectionQuery.data, sendTaskMutation, taskInput]);
  const handleCreateTaskSession = React8.useCallback(() => {
    setChatStore((current) => {
      const urlState = current.byUrl[baseUrl];
      if (!urlState) {
        return current;
      }
      const nextSession = createTaskSession();
      return {
        ...current,
        byUrl: {
          ...current.byUrl,
          [baseUrl]: {
            ...urlState,
            activeSessionId: nextSession.id,
            sessions: [...urlState.sessions, nextSession]
          }
        }
      };
    });
  }, [baseUrl, setChatStore]);
  const handleSelectTaskSession = React8.useCallback(
    (sessionId) => {
      setChatStore((current) => {
        const urlState = current.byUrl[baseUrl];
        if (!urlState || !urlState.sessions.some((session) => session.id === sessionId)) {
          return current;
        }
        if (urlState.activeSessionId === sessionId) {
          return current;
        }
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [baseUrl]: {
              ...urlState,
              activeSessionId: sessionId
            }
          }
        };
      });
    },
    [baseUrl, setChatStore]
  );
  const handleDeleteTaskSession = React8.useCallback(
    (sessionId) => {
      const deletePersistedSession = persistence?.deleteSession;
      if (deletePersistedSession) {
        void deletePersistedSession({ url: baseUrl, sessionId });
      }
      setChatStore((current) => {
        const urlState = current.byUrl[baseUrl];
        if (!urlState || !urlState.sessions.some((session) => session.id === sessionId)) {
          return current;
        }
        const remainingSessions = urlState.sessions.filter((session) => session.id !== sessionId);
        if (remainingSessions.length === 0) {
          const nextSession = createTaskSession();
          return {
            ...current,
            byUrl: {
              ...current.byUrl,
              [baseUrl]: {
                ...urlState,
                activeSessionId: nextSession.id,
                sessions: [nextSession]
              }
            }
          };
        }
        const nextActiveSessionId = urlState.activeSessionId === sessionId ? [...remainingSessions].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? urlState.activeSessionId : urlState.activeSessionId;
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [baseUrl]: {
              ...urlState,
              activeSessionId: nextActiveSessionId,
              sessions: remainingSessions
            }
          }
        };
      });
    },
    [baseUrl, persistence, setChatStore]
  );
  const activeConnection = connectionQuery.data;
  const isConnectedToCurrentUrl = activeConnection.state === "connected" && activeConnection.connectedUrl === baseUrl;
  const isConnectingCurrentUrl = activeConnection.state === "connecting" && activeConnection.pendingUrl === baseUrl;
  const isErrorForCurrentUrl = activeConnection.state === "error" && activeConnection.pendingUrl === baseUrl;
  const connectionState = isConnectedToCurrentUrl ? "connected" : isConnectingCurrentUrl ? "connecting" : isErrorForCurrentUrl ? "error" : "idle";
  const connectionMessage = connectionState === "idle" ? "Not connected" : activeConnection.message;
  return {
    url,
    setUrl,
    connectionState,
    connectionMessage,
    agentName: isConnectedToCurrentUrl ? activeConnection.agentName : null,
    taskInput,
    setTaskInput,
    isSending: sendTaskMutation.isPending,
    messages: activeTaskSession?.messages ?? [],
    recentAgents,
    taskSessions,
    activeTaskSessionId: activeTaskSession?.id ?? null,
    handleConnect,
    handleSelectRecentAgent,
    handleSubmitTask,
    handleCreateTaskSession,
    handleSelectTaskSession,
    handleDeleteTaskSession
  };
}

// src/a2a/inspector-event-renderers.tsx
import "react";
import { jsx as jsx9, jsxs as jsxs3 } from "react/jsx-runtime";
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getStatusMessageData(event) {
  const rawEvent = event.rawEvent;
  if (!isRecord2(rawEvent)) {
    return null;
  }
  if (rawEvent.kind === "status-update" && isRecord2(rawEvent.status)) {
    const data = getFirstDataPartFromMessage(rawEvent.status.message);
    if (data) {
      return data;
    }
  }
  if (rawEvent.kind === "task" && Array.isArray(rawEvent.history)) {
    for (const message of [...rawEvent.history].reverse()) {
      const data = getFirstDataPartFromMessage(message);
      if (data) {
        return data;
      }
    }
  }
  return null;
}
function getFirstDataPartFromMessage(message) {
  if (!isRecord2(message) || !Array.isArray(message.parts)) {
    return null;
  }
  for (const part of message.parts) {
    if (isRecord2(part) && part.kind === "data" && isRecord2(part.data)) {
      return part.data;
    }
  }
  return null;
}
function getArtifactText(event) {
  const rawEvent = event.rawEvent;
  if (!isRecord2(rawEvent) || rawEvent.kind !== "artifact-update" || !isRecord2(rawEvent.artifact)) {
    return null;
  }
  const parts = rawEvent.artifact.parts;
  if (!Array.isArray(parts)) {
    return null;
  }
  const text = parts.flatMap(
    (part) => isRecord2(part) && part.kind === "text" && typeof part.text === "string" ? [part.text] : []
  ).join("");
  return text.length > 0 ? text : null;
}
function formatJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
function CompactJson({ value }) {
  return /* @__PURE__ */ jsx9("pre", { className: "overflow-x-auto rounded-sm bg-muted/40 p-1.5 text-[10px] text-muted-foreground", children: formatJson(value) });
}
function Field({ label, children }) {
  return /* @__PURE__ */ jsxs3("div", { className: "grid gap-0.5", children: [
    /* @__PURE__ */ jsx9("div", { className: "text-[10px] font-medium uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx9("div", { className: "text-[11px] text-foreground [overflow-wrap:anywhere]", children })
  ] });
}
function renderSendTaskTool(data) {
  const input = isRecord2(data.input) ? data.input : {};
  const agent = typeof input.agent === "string" ? input.agent : "unknown agent";
  const content = typeof input.content === "string" ? input.content : "";
  return /* @__PURE__ */ jsxs3("div", { className: "rounded-md border border-sky-500/25 bg-sky-500/10 p-2", children: [
    /* @__PURE__ */ jsx9("div", { className: "text-[11px] font-semibold text-sky-800 dark:text-sky-200", children: "Calling subagent" }),
    /* @__PURE__ */ jsxs3("div", { className: "mt-1 grid gap-2", children: [
      /* @__PURE__ */ jsx9(Field, { label: "Agent", children: agent }),
      content.length > 0 ? /* @__PURE__ */ jsx9(Field, { label: "Message", children: content }) : null
    ] })
  ] });
}
function renderSendTaskResult(data) {
  const output = isRecord2(data.output) ? data.output : null;
  const taskId = output && typeof output.task_id === "string" ? output.task_id : null;
  return /* @__PURE__ */ jsxs3("div", { className: "rounded-md border border-emerald-500/25 bg-emerald-500/10 p-2", children: [
    /* @__PURE__ */ jsx9("div", { className: "text-[11px] font-semibold text-emerald-800 dark:text-emerald-200", children: "Subagent task created" }),
    taskId ? /* @__PURE__ */ jsx9("div", { className: "mt-1 font-mono text-[11px] text-foreground", children: taskId }) : null,
    !taskId ? /* @__PURE__ */ jsx9(CompactJson, { value: data.output }) : null
  ] });
}
function renderCheckTaskStatusCall(data) {
  const input = isRecord2(data.input) ? data.input : {};
  const taskId = typeof input.task_id === "string" ? input.task_id : "unknown task";
  return /* @__PURE__ */ jsxs3("div", { className: "rounded-md border border-violet-500/25 bg-violet-500/10 p-2", children: [
    /* @__PURE__ */ jsx9("div", { className: "text-[11px] font-semibold text-violet-800 dark:text-violet-200", children: "Checking subagent status" }),
    /* @__PURE__ */ jsx9("div", { className: "mt-1 font-mono text-[11px] text-foreground [overflow-wrap:anywhere]", children: taskId })
  ] });
}
function renderCheckTaskStatusResult(data) {
  const output = isRecord2(data.output) ? data.output : null;
  const status = output && isRecord2(output.status) && typeof output.status.state === "string" ? output.status.state : "unknown";
  const artifacts = output && Array.isArray(output.artifacts) ? output.artifacts : [];
  const artifactText = artifacts.flatMap((artifact) => {
    if (!isRecord2(artifact) || !Array.isArray(artifact.parts)) {
      return [];
    }
    return artifact.parts.flatMap(
      (part) => isRecord2(part) && part.kind === "text" && typeof part.text === "string" ? [part.text] : []
    );
  }).join("");
  return /* @__PURE__ */ jsxs3("div", { className: "rounded-md border border-violet-500/25 bg-violet-500/10 p-2", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap items-center gap-2 text-[11px]", children: [
      /* @__PURE__ */ jsx9("span", { className: "font-semibold text-violet-800 dark:text-violet-200", children: "Subagent status" }),
      /* @__PURE__ */ jsx9("span", { className: "rounded-full border border-violet-500/30 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground", children: status })
    ] }),
    artifactText.length > 0 ? /* @__PURE__ */ jsx9("blockquote", { className: "mt-1 border-l-2 border-violet-500/40 pl-2 text-[11px] text-foreground whitespace-pre-wrap", children: artifactText }) : /* @__PURE__ */ jsx9("div", { className: "mt-1", children: /* @__PURE__ */ jsx9(CompactJson, { value: data.output }) })
  ] });
}
function renderGenericToolData(data) {
  const type = typeof data.type === "string" ? data.type : "tool-event";
  const toolName = typeof data.toolName === "string" ? data.toolName : "unknown tool";
  return /* @__PURE__ */ jsxs3("div", { className: "rounded-md border border-border/50 bg-muted/30 p-2", children: [
    /* @__PURE__ */ jsxs3("div", { className: "text-[11px] font-semibold text-foreground", children: [
      type,
      ": ",
      toolName
    ] }),
    /* @__PURE__ */ jsx9("div", { className: "mt-1", children: /* @__PURE__ */ jsx9(CompactJson, { value: data.input ?? data.output ?? data }) })
  ] });
}
var renderInspectorToolEvent = (event) => {
  const data = getStatusMessageData(event);
  if (!data || typeof data.type !== "string") {
    return null;
  }
  const toolName = typeof data.toolName === "string" ? data.toolName : "";
  if (data.type === "tool-call" && toolName === "send_task") {
    return renderSendTaskTool(data);
  }
  if (data.type === "tool-result" && toolName === "send_task") {
    return renderSendTaskResult(data);
  }
  if (data.type === "tool-call" && toolName === "check_task_status") {
    return renderCheckTaskStatusCall(data);
  }
  if (data.type === "tool-result" && toolName === "check_task_status") {
    return renderCheckTaskStatusResult(data);
  }
  if (data.type === "tool-call" || data.type === "tool-result") {
    return renderGenericToolData(data);
  }
  return null;
};
var renderInspectorArtifactEvent = (event) => {
  const text = getArtifactText(event);
  if (!text) {
    return null;
  }
  return /* @__PURE__ */ jsx9("div", { className: "rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-[11px] text-foreground whitespace-pre-wrap [overflow-wrap:anywhere]", children: text });
};
var inspectorEventRenderers = [
  renderInspectorToolEvent,
  renderInspectorArtifactEvent
];

// src/A2AChat.tsx
import { jsx as jsx10, jsxs as jsxs4 } from "react/jsx-runtime";
function getStatusClasses(state) {
  if (state === "connected") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700";
  }
  if (state === "connecting") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700";
  }
  if (state === "error") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  return "border-border bg-muted text-muted-foreground";
}
function getAgentButtonLabel(agentName, agentUrl) {
  if (agentName && agentName.trim().length > 0) {
    return agentName.trim();
  }
  return agentUrl;
}
function A2AChatCard({
  className,
  contentClassName,
  messagesClassName,
  title = "A2A Chat",
  description = "Reusable chat shell component",
  initialUrl,
  proxyBasePath,
  autoConnect,
  showConnectionForm = true,
  showHeader = true,
  showConnectionStatus = true,
  showRecentAgents,
  showTaskSessions = true,
  layout = "default",
  agentSuggestions = [],
  eventRenderers = inspectorEventRenderers,
  persistence
}) {
  const {
    url,
    setUrl,
    connectionState,
    connectionMessage,
    agentName,
    taskInput,
    setTaskInput,
    isSending,
    messages,
    recentAgents,
    taskSessions,
    activeTaskSessionId,
    handleConnect,
    handleSelectRecentAgent,
    handleSubmitTask,
    handleCreateTaskSession,
    handleSelectTaskSession,
    handleDeleteTaskSession
  } = useA2AChat({
    initialUrl,
    proxyBasePath,
    autoConnect,
    persistence
  });
  const isPanel = layout === "panel";
  const shouldShowRecentAgents = showRecentAgents ?? !isPanel;
  return /* @__PURE__ */ jsxs4(Card, { className: cn("w-full max-w-5xl", isPanel && "flex h-full min-w-0 max-w-none flex-col overflow-hidden", className), children: [
    showHeader ? /* @__PURE__ */ jsxs4(CardHeader, { className: cn("border-b border-border", isPanel && "shrink-0 gap-2 p-3"), children: [
      /* @__PURE__ */ jsx10(CardTitle, { className: cn(isPanel && "text-base"), children: title }),
      description ? /* @__PURE__ */ jsx10(CardDescription, { children: description }) : null,
      showConnectionForm ? /* @__PURE__ */ jsxs4(
        "form",
        {
          className: "mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]",
          onSubmit: (event) => {
            event.preventDefault();
            handleConnect();
          },
          children: [
            /* @__PURE__ */ jsx10(
              Input,
              {
                value: url,
                onChange: (event) => setUrl(event.target.value),
                placeholder: "http://localhost:8000",
                "aria-label": "A2A server URL",
                list: agentSuggestions.length > 0 ? "a2a-agent-suggestions" : void 0
              }
            ),
            agentSuggestions.length > 0 ? /* @__PURE__ */ jsx10("datalist", { id: "a2a-agent-suggestions", children: agentSuggestions.map((suggestion) => /* @__PURE__ */ jsx10(
              "option",
              {
                value: suggestion.url,
                label: suggestion.description ? `${suggestion.label} - ${suggestion.description}` : suggestion.label
              },
              suggestion.url
            )) }) : null,
            /* @__PURE__ */ jsx10(
              Button,
              {
                type: "submit",
                variant: "outline",
                disabled: connectionState === "connecting",
                className: "h-9",
                children: connectionState === "connecting" ? "Connecting..." : "Connect"
              }
            )
          ]
        }
      ) : null,
      showConnectionStatus ? /* @__PURE__ */ jsxs4("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx10(
          "div",
          {
            className: cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
              getStatusClasses(connectionState)
            ),
            children: connectionMessage
          }
        ),
        agentName ? /* @__PURE__ */ jsxs4("div", { className: "text-xs text-muted-foreground", children: [
          "Agent: ",
          agentName
        ] }) : null
      ] }) : null
    ] }) : null,
    /* @__PURE__ */ jsx10(CardContent, { className: cn(isPanel && "min-h-0 flex-1 p-3", contentClassName), children: /* @__PURE__ */ jsxs4("div", { className: cn("grid min-w-0 gap-4", isPanel ? "h-full min-h-0 grid-rows-[auto_1fr]" : "md:grid-cols-[15rem_1fr]"), children: [
      shouldShowRecentAgents || showTaskSessions ? /* @__PURE__ */ jsxs4("aside", { className: cn("flex min-w-0 flex-col gap-4 border-b border-border pb-4", !isPanel && "md:border-r md:border-b-0 md:pb-0 md:pr-4"), children: [
        shouldShowRecentAgents ? /* @__PURE__ */ jsxs4("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsx10("div", { className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: "Recent Agents" }),
          /* @__PURE__ */ jsx10("div", { className: "flex max-h-40 flex-col gap-1 overflow-y-auto", children: recentAgents.length > 0 ? recentAgents.map((agent) => /* @__PURE__ */ jsx10(
            Button,
            {
              type: "button",
              variant: agent.url === url ? "default" : "outline",
              size: "sm",
              onClick: () => handleSelectRecentAgent(agent.url),
              className: "justify-start",
              title: agent.url,
              children: /* @__PURE__ */ jsx10("span", { className: "truncate", children: getAgentButtonLabel(agent.agentName, agent.url) })
            },
            agent.url
          )) : /* @__PURE__ */ jsx10("div", { className: "text-xs text-muted-foreground", children: "No recent agent connections yet." }) })
        ] }) : null,
        showTaskSessions ? /* @__PURE__ */ jsxs4("div", { className: "flex min-h-0 min-w-0 flex-1 flex-col gap-2", children: [
          /* @__PURE__ */ jsxs4(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: handleCreateTaskSession,
              disabled: connectionState !== "connected",
              className: "w-full justify-start",
              "aria-label": "New task",
              title: "New task",
              children: [
                /* @__PURE__ */ jsx10(PlusIcon, {}),
                /* @__PURE__ */ jsx10("span", { children: "New Task" })
              ]
            }
          ),
          /* @__PURE__ */ jsx10("div", { className: "mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: "Tasks" }),
          /* @__PURE__ */ jsx10("div", { className: "flex min-w-0 flex-1 flex-col gap-1 overflow-y-auto pb-1", children: taskSessions.map((session) => /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx10(
              Button,
              {
                type: "button",
                variant: session.id === activeTaskSessionId ? "default" : "outline",
                size: "sm",
                onClick: () => handleSelectTaskSession(session.id),
                className: "min-w-0 flex-1 justify-start",
                title: session.title,
                children: /* @__PURE__ */ jsx10("span", { className: "truncate", children: session.title })
              }
            ),
            /* @__PURE__ */ jsx10(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon-sm",
                onClick: () => handleDeleteTaskSession(session.id),
                "aria-label": `Delete task ${session.title}`,
                title: `Delete task ${session.title}`,
                children: /* @__PURE__ */ jsx10(Trash2Icon, {})
              }
            )
          ] }, session.id)) })
        ] }) : null
      ] }) : null,
      /* @__PURE__ */ jsxs4("div", { className: "flex min-h-0 min-w-0 flex-col gap-3", children: [
        /* @__PURE__ */ jsx10(MessageBox, { messages, eventRenderers, className: cn(isPanel && "min-h-0 flex-1", messagesClassName) }),
        /* @__PURE__ */ jsx10(Separator, {}),
        /* @__PURE__ */ jsx10(
          InputBox,
          {
            value: taskInput,
            onChange: setTaskInput,
            onSubmit: handleSubmitTask,
            disabled: connectionState !== "connected" || isSending
          }
        )
      ] })
    ] }) })
  ] });
}
function A2AChat(props) {
  const [queryClient] = React10.useState(() => new QueryClient());
  return /* @__PURE__ */ jsx10(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx10(A2AChatCard, { ...props }) });
}
export {
  A2AChat,
  inspectorEventRenderers
};
