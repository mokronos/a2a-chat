import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

const TargetUrlParams = Schema.Struct({
    target: Schema.String
})

export const A2AProxyApi = HttpApiGroup.make("a2aProxy")
    .add(
        HttpApiEndpoint.get("agentCard")`/api/a2a/agent-card`
            .setUrlParams(TargetUrlParams)
            .addSuccess(Schema.Unknown)
    )
    .add(
        HttpApiEndpoint.post("jsonrpcProxy")`/api/a2a/jsonrpc`
            .setUrlParams(TargetUrlParams)
            .addSuccess(Schema.Unknown)
    )
