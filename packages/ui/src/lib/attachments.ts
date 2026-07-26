import type { FilePart, Part } from "./protocol"

export type AttachmentLimits = {
  accept?: string
  maxFiles?: number
  maxFileSize?: number
  maxTotalBytes?: number
}

export type AttachmentAdapter = {
  convert(file: File, options: { signal: AbortSignal }): Promise<FilePart>
}

export class AttachmentError extends Error {
  constructor(
    readonly code: "accept" | "max-files" | "max-file-size" | "max-total-bytes" | "conversion",
    message: string,
  ) {
    super(message)
    this.name = "AttachmentError"
  }
}

function base64(bytes: ArrayBuffer): string {
  const values = new Uint8Array(bytes)
  let binary = ""
  for (let offset = 0; offset < values.length; offset += 0x8000) {
    binary += String.fromCharCode(...values.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

export const inlineBase64AttachmentAdapter: AttachmentAdapter = {
  async convert(file, { signal }) {
    if (signal.aborted) throw signal.reason
    const bytes = await file.arrayBuffer()
    if (signal.aborted) throw signal.reason
    return {
      kind: "file",
      file: {
        bytes: base64(bytes),
        mimeType: file.type || "application/octet-stream",
        name: file.name,
      },
    }
  },
}

export function createUploadAttachmentAdapter(
  upload: (file: File, options: { signal: AbortSignal }) => Promise<string | { uri: string }>,
): AttachmentAdapter {
  return {
    async convert(file, options) {
      const uploaded = await upload(file, options)
      const uri = typeof uploaded === "string" ? uploaded : uploaded.uri
      if (!uri) throw new AttachmentError("conversion", `Upload did not return a URI for ${file.name}`)
      return {
        kind: "file",
        file: {
          uri,
          mimeType: file.type || "application/octet-stream",
          name: file.name,
        },
      }
    },
  }
}

function accepts(file: File, accept: string | undefined): boolean {
  if (!accept?.trim()) return true
  return accept.split(",").some((entry) => {
    const pattern = entry.trim().toLowerCase()
    if (!pattern) return false
    if (pattern.startsWith(".")) return file.name.toLowerCase().endsWith(pattern)
    if (pattern.endsWith("/*")) return file.type.toLowerCase().startsWith(pattern.slice(0, -1))
    return file.type.toLowerCase() === pattern
  })
}

export function validateAttachments(files: readonly File[], limits: AttachmentLimits = {}): void {
  if (limits.maxFiles !== undefined && files.length > limits.maxFiles) {
    throw new AttachmentError("max-files", `Choose at most ${limits.maxFiles} files.`)
  }
  const rejected = files.find((file) => !accepts(file, limits.accept))
  if (rejected) throw new AttachmentError("accept", `${rejected.name} is not an accepted file type.`)
  const oversized = files.find(
    (file) => limits.maxFileSize !== undefined && file.size > limits.maxFileSize,
  )
  if (oversized) {
    throw new AttachmentError("max-file-size", `${oversized.name} exceeds the per-file size limit.`)
  }
  const total = files.reduce((sum, file) => sum + file.size, 0)
  if (limits.maxTotalBytes !== undefined && total > limits.maxTotalBytes) {
    throw new AttachmentError("max-total-bytes", "Attachments exceed the total size limit.")
  }
}

export async function attachmentsToParts(input: {
  files: readonly File[]
  adapter?: AttachmentAdapter
  limits?: AttachmentLimits
  signal?: AbortSignal
}): Promise<FilePart[]> {
  validateAttachments(input.files, input.limits)
  const controller = input.signal ? undefined : new AbortController()
  const signal = input.signal ?? controller!.signal
  try {
    return await Promise.all(
      input.files.map((file) => (input.adapter ?? inlineBase64AttachmentAdapter).convert(file, { signal })),
    )
  } catch (cause) {
    if (cause instanceof AttachmentError) throw cause
    throw new AttachmentError(
      "conversion",
      cause instanceof Error ? cause.message : "Could not prepare attachments.",
    )
  }
}

export function composeOutgoingParts(input: {
  text?: string
  files?: readonly FilePart[]
  dataParts?: readonly Extract<Part, { kind: "data" }>[]
}): Part[] {
  const parts: Part[] = []
  if (input.text?.trim()) parts.push({ kind: "text", text: input.text.trim() })
  parts.push(...(input.files ?? []), ...(input.dataParts ?? []))
  return parts
}
