import { Layer } from "effect";
import { InspectorApi } from "./api/api";
import { BunRuntime } from "@effect/platform-bun";
import { BunHttpServer } from "@effect/platform-bun";
import { HttpApiBuilder, HttpApiSwagger } from "@effect/platform";
import { utilsHandler } from "./api/handlers/utils";

const InspectorApiLive = HttpApiBuilder.api(InspectorApi).pipe(Layer.provide(utilsHandler))

const ServerLive = HttpApiBuilder.serve().pipe(
    Layer.provide(InspectorApiLive),
    Layer.provide(HttpApiSwagger.layer()),
    Layer.provide(BunHttpServer.layer({ port: 3001 }))
)

// Launch the server
Layer.launch(ServerLive).pipe(BunRuntime.runMain)
