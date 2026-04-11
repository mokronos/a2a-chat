import React from "react"

type Message = {
  id: string
  role: "user" | "assistant"
  text: string
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "m1",
    role: "assistant",
    text: "Hey there. This is a placeholder assistant message.",
  },
  {
    id: "m2",
    role: "user",
    text: "Nice. I only need the component shell right now.",
  },
]

function MessageBox() {
  return (
    <div className="flex h-72 flex-col gap-3 overflow-auto rounded-md border border-border bg-background p-3">
      {MOCK_MESSAGES.map((message) => {
        const isUser = message.role === "user"

        return (
          <div
            key={message.id}
            className={isUser ? "ml-8 self-end" : "mr-8 self-start"}
          >
            <div
              className={
                isUser
                  ? "rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
                  : "rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-foreground"
              }
            >
              {message.text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { MessageBox }
