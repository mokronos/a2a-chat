# a2a-chat

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

To build everything:

```bash
bun run build
```

To create a local package tarball for testing without publishing:

```bash
bun run pack:server
```

To run the packaged server locally with Bun:

```bash
bun run bunx:server
```

Or call `bunx` directly:

```bash
bunx --package a2a-chat-server@file:$PWD/apps/server a2a-chat-server
```

To run it through npm tooling, Bun must be installed because the CLI uses Bun server APIs:

```bash
npx --package ./apps/server a2a-chat-server
```

To typecheck:

```bash
bun run typecheck
```

The server app builds the shared UI package before starting, so the project can be run from the workspace root after `bun install`.

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
