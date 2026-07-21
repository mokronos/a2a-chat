import { InspectorApi, CoreHandlers } from "@mokronos/a2a-chat-api";
import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { Layer } from "effect";
import { extname, resolve } from "node:path";

const PORT = 19999
const PUBLIC_DIR = resolve(import.meta.dir, "..", "public")

const InspectorApiLive = HttpApiBuilder.api(InspectorApi).pipe(Layer.provide(CoreHandlers))
const ApiLayer = Layer.mergeAll(InspectorApiLive, HttpServer.layerContext) as Layer.Layer<any, any, never>
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

const COMPRESSIBLE = new Set([".css", ".html", ".js", ".json", ".svg"])

async function serveStatic(pathname: string, acceptEncoding: string, ifNoneMatch: string): Promise<Response> {
    const normalizedPath = pathname === "/" ? "/index.html" : pathname
    const filePath = resolve(PUBLIC_DIR, `.${normalizedPath}`)

    if (!filePath.startsWith(PUBLIC_DIR)) {
        return new Response("Not found", { status: 404 })
    }

    let file = Bun.file(filePath)
    let fileName = file.name ?? filePath

    if (!(await file.exists())) {
        const fallbackPath = resolve(PUBLIC_DIR, "index.html")
        file = Bun.file(fallbackPath)
        fileName = file.name ?? fallbackPath
        if (!(await file.exists())) {
            return new Response("Not found", { status: 404 })
        }
    }

    const headers = new Headers()
    const contentType = getContentType(fileName)
    if (contentType) {
        headers.set("content-type", contentType)
    }

    // Assets are fingerprint-free (app.js, styles.css), so they MUST revalidate —
    // otherwise a rebuilt bundle stays hidden behind the browser cache and the
    // page renders whatever stale JS it already has. `no-cache` + an ETag keyed
    // on size/mtime lets the browser skip re-pulling the ~29MB bundle when it's
    // unchanged (304) while always picking up a fresh build.
    if (fileName.startsWith(resolve(PUBLIC_DIR, "assets"))) {
        const etag = `"${file.size}-${file.lastModified}"`
        headers.set("cache-control", "no-cache")
        headers.set("etag", etag)
        if (ifNoneMatch === etag) {
            return new Response(null, { status: 304, headers })
        }
    }

    // Gzip text assets — the unminified bundle is ~24MB raw but a few MB gzipped.
    const ext = extname(fileName)
    if (COMPRESSIBLE.has(ext) && acceptEncoding.includes("gzip")) {
        const compressed = Bun.gzipSync(new Uint8Array(await file.arrayBuffer()))
        headers.set("content-encoding", "gzip")
        headers.set("vary", "accept-encoding")
        return new Response(compressed, { headers })
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

        return serveStatic(
            url.pathname,
            request.headers.get("accept-encoding") ?? "",
            request.headers.get("if-none-match") ?? "",
        )
    },
})

console.log(`Server running on http://localhost:${PORT}`)
