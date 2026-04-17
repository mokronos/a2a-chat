import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

const proxyBasePath = "/api/a2a"

function isHttpTarget(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function getTargetFromRequest(url: string): string | null {
  const parsed = new URL(url, "http://localhost")
  const target = parsed.searchParams.get("target")?.trim() ?? ""

  if (target.length === 0 || !isHttpTarget(target)) {
    return null
  }

  return target
}

function sendJson(res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void }, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

function readRequestBody(req: { on: (event: string, listener: (...args: unknown[]) => void) => void }): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk: unknown) => {
      if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk))
        return
      }

      chunks.push(chunk as Buffer)
    })
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", (error) => reject(error))
  })
}

function proxyPlugin(): Plugin {
  return {
    name: "a2a-local-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.method) {
          next()
          return
        }

        if (req.url.startsWith(`${proxyBasePath}/agent-card`) && req.method === "GET") {
          const target = getTargetFromRequest(req.url)
          if (!target) {
            sendJson(res, 400, { error: "Invalid target URL" })
            return
          }

          const normalizedTarget = target.endsWith("/") ? target.slice(0, -1) : target
          const agentCardUrl = `${normalizedTarget}/.well-known/agent-card.json`

          try {
            const response = await fetch(agentCardUrl)
            const payload = await response.text()
            if (!response.ok) {
              console.error("[a2a-proxy] agent-card error", {
                target,
                agentCardUrl,
                status: response.status,
                body: payload,
              })
            }
            res.statusCode = response.status
            res.setHeader("Content-Type", response.headers.get("content-type") ?? "application/json")
            res.end(payload)
          } catch (error) {
            console.error("[a2a-proxy] agent-card proxy failure", {
              target,
              agentCardUrl,
              error,
            })
            sendJson(res, 502, {
              error:
                error instanceof Error
                  ? `Failed to fetch agent card: ${error.message}`
                  : "Failed to fetch agent card",
            })
          }
          return
        }

        if (req.url.startsWith(`${proxyBasePath}/jsonrpc`) && req.method === "POST") {
          const target = getTargetFromRequest(req.url)
          if (!target) {
            sendJson(res, 400, { error: "Invalid target URL" })
            return
          }

          let requestBody: Uint8Array
          try {
            requestBody = await readRequestBody(req)
          } catch {
            sendJson(res, 400, { error: "Could not read request body" })
            return
          }

          const headers = new Headers()
          const contentType = req.headers["content-type"]
          if (typeof contentType === "string") {
            headers.set("content-type", contentType)
          }

          try {
            const response = await fetch(target, {
              method: "POST",
              headers,
              body: requestBody,
            })
            const payload = await response.text()
            if (!response.ok) {
              console.error("[a2a-proxy] jsonrpc error", {
                target,
                status: response.status,
                requestBody: Buffer.from(requestBody).toString("utf8"),
                responseBody: payload,
              })
            }
            res.statusCode = response.status
            res.setHeader("Content-Type", response.headers.get("content-type") ?? "application/json")
            res.end(payload)
          } catch (error) {
            console.error("[a2a-proxy] jsonrpc proxy failure", {
              target,
              error,
            })
            sendJson(res, 502, {
              error:
                error instanceof Error
                  ? `Failed to proxy JSON-RPC request: ${error.message}`
                  : "Failed to proxy JSON-RPC request",
            })
          }
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), proxyPlugin()],
})
