import { describe, expect, it } from "bun:test"
import { AttachmentError, attachmentsToParts, composeOutgoingParts, createUploadAttachmentAdapter, validateAttachments } from "./attachments"

describe("attachments", () => {
  it("converts multiple files to inline protocol FileParts without filename text", async () => {
    const files = [new File(["hello"], "hello.txt", { type: "text/plain" }), new File([new Uint8Array([1, 2])], "bytes.bin", { type: "application/octet-stream" })]
    const parts = await attachmentsToParts({ files })
    expect(parts).toHaveLength(2)
    expect(parts[0]).toEqual({ kind: "file", file: { bytes: "aGVsbG8=", mimeType: files[0]!.type, name: "hello.txt" } })
    expect(composeOutgoingParts({ files: parts })).toEqual(parts)
  })

  it("creates URI parts and preserves MIME type and name", async () => {
    const adapter = createUploadAttachmentAdapter(async (file) => `https://files.example/${file.name}`)
    const [part] = await attachmentsToParts({ files: [new File(["x"], "x.txt", { type: "text/plain" })], adapter })
    expect(part).toEqual({ kind: "file", file: { uri: "https://files.example/x.txt", mimeType: new File(["x"], "x.txt", { type: "text/plain" }).type, name: "x.txt" } })
  })

  it("enforces count, file, total-byte, and accept limits", () => {
    const text = new File(["1234"], "a.txt", { type: "text/plain" })
    const image = new File(["12"], "a.png", { type: "image/png" })
    expect(() => validateAttachments([text, image], { maxFiles: 1 })).toThrow(AttachmentError)
    expect(() => validateAttachments([text], { maxFileSize: 3 })).toThrow("per-file")
    expect(() => validateAttachments([text, image], { maxTotalBytes: 5 })).toThrow("total")
    expect(() => validateAttachments([text], { accept: "image/*" })).toThrow("accepted")
  })

  it("forwards AbortSignal to upload adapters", async () => {
    const abort = new AbortController()
    const adapter = createUploadAttachmentAdapter(async (_file, { signal }) => { expect(signal).toBe(abort.signal); return "https://files.example/x" })
    await attachmentsToParts({ files: [new File(["x"], "x")], adapter, signal: abort.signal })
  })
})
