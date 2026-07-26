import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"

import { InspectorApi } from "../api"
import { A2AProxy } from "../a2a/proxy"

function requestSignal(source: unknown): AbortSignal | undefined {
    return source instanceof Request ? source.signal : undefined
}

export const a2aProxyHandler = HttpApiBuilder.group(InspectorApi, "a2aProxy", (handlers) =>
    handlers
        .handleRaw("agentCard", ({ urlParams, request }) =>
            Effect.flatMap(A2AProxy, (proxy) =>
                proxy.agentCard({
                    targetId: urlParams.targetId,
                    headers: request.headers,
                    signal: requestSignal(request.source),
                })
            )
        )
        .handleRaw("jsonrpcProxy", ({ urlParams, request }) =>
            Effect.flatMap(A2AProxy, (proxy) =>
                proxy.jsonRpc({
                    targetId: urlParams.targetId,
                    headers: request.headers,
                    signal: requestSignal(request.source),
                    body: request.stream,
                })
            )
        )
)
