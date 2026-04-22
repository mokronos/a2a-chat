import { HttpApiBuilder } from "@effect/platform";
import { InspectorApi } from "../api";
import { Effect } from "effect";

export const utilsHandler = HttpApiBuilder.group(InspectorApi, "utils", (handlers) =>
    handlers.handle("health", () => Effect.succeed("OK"))
)
