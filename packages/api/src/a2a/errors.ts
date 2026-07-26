import { Schema } from "effect"

const ErrorFields = {
    code: Schema.String,
    message: Schema.String,
}

export class ProxyBadRequest extends Schema.TaggedError<ProxyBadRequest>()(
    "ProxyBadRequest",
    ErrorFields,
) {}

export class ProxyForbidden extends Schema.TaggedError<ProxyForbidden>()(
    "ProxyForbidden",
    ErrorFields,
) {}

export class ProxyPayloadTooLarge extends Schema.TaggedError<ProxyPayloadTooLarge>()(
    "ProxyPayloadTooLarge",
    ErrorFields,
) {}

export class ProxyBadGateway extends Schema.TaggedError<ProxyBadGateway>()(
    "ProxyBadGateway",
    ErrorFields,
) {}

export class ProxyGatewayTimeout extends Schema.TaggedError<ProxyGatewayTimeout>()(
    "ProxyGatewayTimeout",
    ErrorFields,
) {}

export type A2AProxyError =
    | ProxyBadRequest
    | ProxyForbidden
    | ProxyPayloadTooLarge
    | ProxyBadGateway
    | ProxyGatewayTimeout
