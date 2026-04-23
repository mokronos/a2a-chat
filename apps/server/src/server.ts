import { InspectorApi, CoreHandlers } from "@a2a-chat/api";
import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { Layer } from "effect";
import { extname, resolve } from "node:path";

const PORT = 3001
const PUBLIC_DIR = resolve(import.meta.dir, "..", "public")

const InspectorApiLive = HttpApiBuilder.api(InspectorApi).pipe(Layer.provide(CoreHandlers))
const ApiLayer = Layer.mergeAll(InspectorApiLive, HttpServer.layerContext) as Layer.Layer<any, any, any>
const { handler: apiHandler } = HttpApiBuilder.toWebHandler(ApiLayer)

const CONTENT_TYPES: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
}

function getContentType(pathname: string) {
    return CONTENT_TYPES[extname(pathname)]
}

async function serveStatic(pathname: string): Promise<Response> {
    const normalizedPath = pathname === "/" ? "/index.html" : pathname
    const filePath = resolve(PUBLIC_DIR, `.${normalizedPath}`)

    if (!filePath.startsWith(PUBLIC_DIR)) {
        return new Response("Not found", { status: 404 })
    }

    let file = Bun.file(filePath)

    if (!(await file.exists())) {
        file = Bun.file(resolve(PUBLIC_DIR, "index.html"))
        if (!(await file.exists())) {
            return new Response("Not found", { status: 404 })
        }
    }

    const headers = new Headers()
    const contentType = getContentType(file.name)
    if (contentType) {
        headers.set("content-type", contentType)
    }

    return new Response(file, { headers })
}

Bun.serve({
    port: PORT,
    fetch: (request) => {
        const url = new URL(request.url)
        if (url.pathname.startsWith("/api/")) {
            return apiHandler(request)
        }

        return serveStatic(url.pathname)
    },
})

console.log(`Server running on http://localhost:${PORT}`)
