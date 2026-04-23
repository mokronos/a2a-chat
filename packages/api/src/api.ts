import { HttpApi } from "@effect/platform";
import { UtilsApi } from "./utils/api";
import { A2AProxyApi } from "./a2a/api";

export const InspectorApi = HttpApi.make("InspectorApi")
    .add(UtilsApi)
    .add(A2AProxyApi)
