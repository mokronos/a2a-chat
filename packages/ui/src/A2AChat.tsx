import React from "react"

import { InputBox } from "./components/shared/input-box"
import { MessageBox } from "./components/shared/message-box"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import { Separator } from "./components/ui/separator"
import { cn } from "./lib/utils"

type A2AChatProps = {
  className?: string
  title?: string
  description?: string
}

export function A2AChat({
  className,
  title = "A2A Chat",
  description = "Reusable chat shell component",
}: A2AChatProps) {
  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader className="border-b border-border">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <MessageBox />
      </CardContent>

      <Separator />

      <CardFooter>
        <div className="w-full">
          <InputBox />
        </div>
      </CardFooter>
    </Card>
  )
}
