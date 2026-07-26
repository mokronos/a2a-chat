import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

import {
    ProxyBadGateway,
    ProxyBadRequest,
    ProxyForbidden,
    ProxyGatewayTimeout,
    ProxyPayloadTooLarge,
} from "./errors"

const TargetIdParams = Schema.Struct({
    targetId: Schema.optional(Schema.String),
})

export const A2AProxyApi = HttpApiGroup.make("a2aProxy")
    .addError(ProxyBadRequest, { status: 400 })
    .addError(ProxyForbidden, { status: 403 })
    .addError(ProxyPayloadTooLarge, { status: 413 })
    .addError(ProxyBadGateway, { status: 502 })
    .addError(ProxyGatewayTimeout, { status: 504 })
    .add(
        HttpApiEndpoint.get("agentCard")`/api/a2a/agent-card`
            .setUrlParams(TargetIdParams)
            .addSuccess(Schema.Unknown),
    )
    .add(
        HttpApiEndpoint.post("jsonrpcProxy")`/api/a2a/jsonrpc`
            .setUrlParams(TargetIdParams)
            .addSuccess(Schema.Unknown),
    )
