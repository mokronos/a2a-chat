import { HttpApiBuilder } from "@effect/platform";
import { HttpServerResponse } from "@effect/platform";
import { InspectorApi } from "../api";
import { Effect } from "effect";

function parseTargetUrl(target: string): URL | null {
    try {
        const url = new URL(target)
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return null
        }
        return url
    } catch {
        return null
    }
}

function toBadRequest(message: string) {
    return HttpServerResponse.json({ error: message }, { status: 400 })
}

function toBadGateway(message: string) {
    return HttpServerResponse.json({ error: message }, { status: 502 })
}

export const a2aProxyHandler = HttpApiBuilder.group(InspectorApi, "a2aProxy", (handlers) =>
    handlers
        .handleRaw("agentCard", ({ urlParams }) => {
            const targetUrl = parseTargetUrl(urlParams.target)
            if (!targetUrl) {
                return Effect.succeed(toBadRequest("Invalid 'target' query parameter"))
            }

            const agentCardUrl = new URL("/.well-known/agent.json", targetUrl)

            return Effect.tryPromise(() => fetch(agentCardUrl.toString())).pipe(
                Effect.map((response) => HttpServerResponse.fromWeb(response)),
                Effect.catchAll(() =>
                    Effect.succeed(toBadGateway("Could not reach target agent card endpoint"))
                )
            )
        })
        .handleRaw("jsonrpcProxy", ({ urlParams, request }) => {
            const targetUrl = parseTargetUrl(urlParams.target)
            if (!targetUrl) {
                return Effect.succeed(toBadRequest("Invalid 'target' query parameter"))
            }

            return request.text.pipe(
                Effect.flatMap((bodyText) =>
                    Effect.tryPromise(() =>
                        fetch(targetUrl.toString(), {
                            method: "POST",
                            headers: {
                                "content-type": request.headers["content-type"] ?? "application/json"
                            },
                            body: bodyText
                        })
                    )
                ),
                Effect.map((response) => HttpServerResponse.fromWeb(response)),
                Effect.catchAll(() =>
                    Effect.succeed(toBadGateway("Could not reach target JSON-RPC endpoint"))
                )
            )
        })
)
