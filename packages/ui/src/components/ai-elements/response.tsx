"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { ComponentProps } from "react";
import { memo } from "react";
import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";

export type ResponseProps = ComponentProps<typeof Streamdown>;

const streamdownPlugins = { cjk, code, math, mermaid };

/**
 * Streaming markdown renderer (math, code, mermaid, CJK). Kept from AI Elements
 * because shadcn's chat components render plain children — they don't ship a
 * markdown renderer. Drop this inside a `BubbleContent` to render agent text.
 */
export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    nextProps.isAnimating === prevProps.isAnimating
);

Response.displayName = "Response";
