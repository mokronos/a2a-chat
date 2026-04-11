import React from "react"
import { ArrowUpIcon } from "lucide-react"

import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

function InputBox() {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        placeholder="Write a message..."
        className="min-h-20 resize-none"
      />
      <div className="flex justify-end">
        <Button variant="outline" size="icon" disabled aria-label="Send message">
          <ArrowUpIcon />
        </Button>
      </div>
    </div>
  )
}

export { InputBox }
