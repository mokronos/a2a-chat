"use client"

import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"
import type { ComponentProps } from "react"
import { Streamdown } from "streamdown"

const plugins = { cjk, code, math, mermaid }
export type RichResponseProps = ComponentProps<typeof Streamdown>
export function RichResponse(props: RichResponseProps) { return <Streamdown plugins={plugins} {...props} /> }
