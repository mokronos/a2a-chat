import {
    FetchHttpClient,
    HttpApi,
    HttpApiBuilder,
    HttpApiClient,
    HttpApiEndpoint,
    HttpApiGroup,
    HttpApiSwagger
} from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer, Schema } from "effect"

// Define our API with one group named "Greetings" and one endpoint called "hello-world"
const MyApi = HttpApi.make("MyApi").add(
    HttpApiGroup.make("Greetings").add(
        HttpApiEndpoint.get("hello-world")`/`.addSuccess(Schema.String)
    )
)

// Implement the "Greetings" group
const GreetingsLive = HttpApiBuilder.group(MyApi, "Greetings", (handlers) =>
    handlers.handle("hello-world", () => Effect.succeed("Hello, World!"))
)

// Provide the implementation for the API
const MyApiLive = HttpApiBuilder.api(MyApi).pipe(Layer.provide(GreetingsLive))

// Set up the server using NodeHttpServer on port 3000
const ServerLive = HttpApiBuilder.serve().pipe(
    Layer.provide(HttpApiSwagger.layer()),
    Layer.provide(MyApiLive),
    Layer.provide(BunHttpServer.layer({ port: 3001 }))
)

// Launch the server
Layer.launch(ServerLive).pipe(BunRuntime.runMain)


const program = Effect.gen(function* () {
    const client = yield* HttpApiClient.make(MyApi, {
        baseUrl: "http://localhost:3001"
    })
    const hello = yield* client.Greetings["hello-world"]()
    console.log(hello)
})

Effect.runSync(program.pipe(Effect.provide(FetchHttpClient.layer)))
