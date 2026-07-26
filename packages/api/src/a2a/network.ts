import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

import { Effect } from "effect"

import { ProxyBadGateway, ProxyForbidden } from "./errors"

export interface ResolvedAddress {
    readonly address: string
    readonly family: 4 | 6
}

export interface A2AProxyDnsResolver {
    readonly lookup: (
        hostname: string,
        signal: AbortSignal,
    ) => PromiseLike<ReadonlyArray<ResolvedAddress>>
}

export const defaultDnsResolver: A2AProxyDnsResolver = {
    lookup: (hostname) => lookup(hostname, { all: true, verbatim: true }) as Promise<ResolvedAddress[]>,
}

function parseIpv4(address: string): number | undefined {
    if (isIP(address) !== 4) return undefined
    const octets = address.split(".").map(Number)
    return (((octets[0]! << 24) >>> 0) + (octets[1]! << 16) + (octets[2]! << 8) + octets[3]!) >>> 0
}

function ipv4InCidr(address: number, base: number, bits: number): boolean {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
    return (address & mask) >>> 0 === (base & mask) >>> 0
}

function ipv4NumberToString(address: number): string {
    return [24, 16, 8, 0].map((shift) => (address >>> shift) & 0xff).join(".")
}

function parseIpv6(address: string): bigint | undefined {
    let input = address.toLowerCase()
    if (input.startsWith("[") && input.endsWith("]")) input = input.slice(1, -1)
    if (input.includes("%") || isIP(input) !== 6) return undefined

    if (input.includes(".")) {
        const lastColon = input.lastIndexOf(":")
        const ipv4 = parseIpv4(input.slice(lastColon + 1))
        if (ipv4 === undefined) return undefined
        input = `${input.slice(0, lastColon)}:${(ipv4 >>> 16).toString(16)}:${(ipv4 & 0xffff).toString(16)}`
    }

    const halves = input.split("::")
    if (halves.length > 2) return undefined
    const left = halves[0] ? halves[0].split(":") : []
    const right = halves[1] ? halves[1].split(":") : []
    const missing = 8 - left.length - right.length
    if ((halves.length === 1 && missing !== 0) || missing < 0) return undefined

    const groups = [...left, ...Array.from({ length: missing }, () => "0"), ...right]
    if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
        return undefined
    }

    return groups.reduce((value, group) => (value << 16n) | BigInt(`0x${group}`), 0n)
}

function ipv6InCidr(address: bigint, base: bigint, bits: number): boolean {
    const shift = BigInt(128 - bits)
    return address >> shift === base >> shift
}

const ipv4BlockedRanges = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
] as const

const ipv6BlockedRanges = [
    ["::", 128],
    ["::1", 128],
    ["64:ff9b:1::", 48],
    ["100::", 64],
    ["2001::", 23],
    ["2001:db8::", 32],
    ["3fff::", 20],
    ["5f00::", 16],
    ["fc00::", 7],
    ["fe80::", 10],
    ["fec0::", 10],
    ["ff00::", 8],
] as const

export function isBlockedIpAddress(address: string): boolean {
    const ipv4 = parseIpv4(address)
    if (ipv4 !== undefined) {
        return ipv4BlockedRanges.some(([base, bits]) => ipv4InCidr(ipv4, parseIpv4(base)!, bits))
    }

    const ipv6 = parseIpv6(address)
    if (ipv6 === undefined) return true

    const ipv4MappedPrefix = parseIpv6("::ffff:0:0")!
    if (ipv6InCidr(ipv6, ipv4MappedPrefix, 96)) {
        return isBlockedIpAddress(ipv4NumberToString(Number(ipv6 & 0xffffffffn)))
    }

    const ipv4CompatiblePrefix = parseIpv6("::")!
    if (ipv6InCidr(ipv6, ipv4CompatiblePrefix, 96) && ipv6 > 1n) {
        return isBlockedIpAddress(ipv4NumberToString(Number(ipv6 & 0xffffffffn)))
    }

    const nat64Prefix = parseIpv6("64:ff9b::")!
    if (ipv6InCidr(ipv6, nat64Prefix, 96)) {
        return isBlockedIpAddress(ipv4NumberToString(Number(ipv6 & 0xffffffffn)))
    }

    const sixToFourPrefix = parseIpv6("2002::")!
    if (ipv6InCidr(ipv6, sixToFourPrefix, 16)) {
        if (isBlockedIpAddress(ipv4NumberToString(Number((ipv6 >> 80n) & 0xffffffffn)))) return true
    }

    return ipv6BlockedRanges.some(([base, bits]) => ipv6InCidr(ipv6, parseIpv6(base)!, bits))
}

function normalizedHostname(url: URL): string {
    return url.hostname.startsWith("[") && url.hostname.endsWith("]")
        ? url.hostname.slice(1, -1)
        : url.hostname
}

export function validateNetworkUrl(input: {
    readonly url: URL
    readonly resolver: A2AProxyDnsResolver
    readonly allowPrivateAddresses: boolean
    readonly signal?: AbortSignal
}): Effect.Effect<ReadonlyArray<ResolvedAddress>, ProxyForbidden | ProxyBadGateway> {
    const { url } = input
    if (
        (url.protocol !== "http:" && url.protocol !== "https:")
        || url.username
        || url.password
        || url.hash
    ) {
        return Effect.fail(
            new ProxyForbidden({
                code: "unsafe_target_url",
                message: "Target URLs must use HTTP(S) and cannot contain credentials or fragments",
            }),
        )
    }

    const hostname = normalizedHostname(url)
    if (hostname.includes("%")) {
        return Effect.fail(
            new ProxyForbidden({
                code: "unsafe_target_url",
                message: "IPv6 zone identifiers are not allowed",
            }),
        )
    }

    const family = isIP(hostname)
    const resolveAddresses: Effect.Effect<ReadonlyArray<ResolvedAddress>, ProxyBadGateway> = family === 4 || family === 6
        ? Effect.succeed([{ address: hostname, family } as ResolvedAddress])
        : Effect.tryPromise({
            try: (effectSignal) =>
                input.resolver.lookup(
                    hostname,
                    input.signal ? AbortSignal.any([effectSignal, input.signal]) : effectSignal,
                ),
            catch: () =>
                new ProxyBadGateway({
                    code: "dns_resolution_failed",
                    message: "Could not resolve the target host",
                }),
        })

    return resolveAddresses.pipe(
        Effect.flatMap((addresses): Effect.Effect<
            ReadonlyArray<ResolvedAddress>,
            ProxyForbidden | ProxyBadGateway
        > => {
            if (addresses.length === 0) {
                return Effect.fail(
                    new ProxyBadGateway({
                        code: "dns_resolution_failed",
                        message: "The target host resolved without any addresses",
                    }),
                )
            }

            const invalidAddress = addresses.find(({ address, family }) =>
                (family !== 4 && family !== 6) || isIP(address) !== family
            )
            if (invalidAddress) {
                return Effect.fail(
                    new ProxyBadGateway({
                        code: "invalid_dns_response",
                        message: "The DNS resolver returned an invalid address",
                    }),
                )
            }

            if (!input.allowPrivateAddresses && addresses.some(({ address }) => isBlockedIpAddress(address))) {
                return Effect.fail(
                    new ProxyForbidden({
                        code: "private_address_blocked",
                        message: "The target resolves to a private, local, or non-routable address",
                    }),
                )
            }

            return Effect.succeed(addresses)
        }),
    )
}
