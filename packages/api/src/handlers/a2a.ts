import { HttpApiBuilder } from "@effect/platform";
import { InspectorApi } from "../api";
import { Effect } from "effect";

export const a2aHandler = HttpApiBuilder.group(InspectorApi, "a2a", (handlers) =>
    handlers.handle("a2a", () => Effect.succeed("A2AOk"))
)
