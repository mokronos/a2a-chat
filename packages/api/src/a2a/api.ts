import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

export const A2AApi = HttpApiGroup.make("a2a").add(
    HttpApiEndpoint.get("a2a")`/`.addSuccess(Schema.String)
)
