import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

export const UtilsApi = HttpApiGroup.make("utils").add(
    HttpApiEndpoint.get("health")`/`.addSuccess(Schema.String)
)
