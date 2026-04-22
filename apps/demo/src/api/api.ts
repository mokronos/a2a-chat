import { HttpApi } from "@effect/platform";
import { UtilsApi } from "./utils/api";

export const InspectorApi = HttpApi.make("InspectorApi").add(
    UtilsApi,
)

