import { HttpApiBuilder } from "@effect/platform";
import { InspectorApi } from "../api";
import { Effect } from "effect";

export const a2aProxyHandler = HttpApiBuilder.group(InspectorApi, "a2aProxy", (handlers) =>
    handlers.handle("a2aProxy", () => Effect.succeed("A2AOk"))
)
