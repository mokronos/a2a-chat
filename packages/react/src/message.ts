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

export type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  thinkingText?: string
  status?: string
  isWorking?: boolean
  statusHistory?: MessageStatusHistoryEntry[]
  events?: MessageTimelineEvent[]
}
