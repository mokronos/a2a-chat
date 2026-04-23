import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

export const A2AProxyApi = HttpApiGroup.make("a2aProxy").add(
    HttpApiEndpoint.get("a2aProxy")`/a2a`.addSuccess(Schema.String)
)
