import { Layer } from "effect";
import { utilsHandler } from "./handlers/utils";
import { a2aProxyHandler } from "./handlers/a2a";

export const CoreHandlers = Layer.mergeAll(
    utilsHandler,
    a2aProxyHandler
);
