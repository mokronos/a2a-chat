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

## Versioning GitHub installs

When this repo is consumed directly from GitHub, pin the dependency to a Git tag instead of an unversioned branch:

```json
{
  "dependencies": {
    "a2a-chat": "github:mokronos/a2a-chat#v0.0.1"
  }
}
```

GitHub dependencies are locked to a commit in `bun.lock`, so pushing to this repo is not enough for another repo to receive changes. Cut a new version here, push the tag, then update the consuming repo to that tag.

```bash
bun run version:patch
git push --follow-tags
```

Use `bun run version:minor` or `bun run version:major` when the change warrants it.

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
