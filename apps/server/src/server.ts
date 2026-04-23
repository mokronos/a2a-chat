import { Layer } from "effect";
import { InspectorApi, CoreHandlers } from "@a2a-chat/api";
import { BunRuntime } from "@effect/platform-bun";
import { BunHttpServer } from "@effect/platform-bun";
import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";

const InspectorApiLive = HttpApiBuilder.api(InspectorApi).pipe(
    Layer.provide(CoreHandlers),
)

const ServerLive = HttpApiBuilder.serve().pipe(
    Layer.provide(HttpApiSwagger.layer()),
    Layer.provide(InspectorApiLive),
    HttpServer.withLogAddress,
    Layer.provide(BunHttpServer.layer({ port: 3001 }))
)

// Launch the server
Layer.launch(ServerLive).pipe(BunRuntime.runMain)
