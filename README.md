# a2a-chat

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To run the playground app:

```bash
bun run --cwd apps/playground dev
```

Or from the workspace root (recommended):

```bash
bun run dev:inspector
```

The inspector uses a local proxy (`/api/a2a/*`) so the browser is never blocked by CORS when testing arbitrary A2A server URLs.

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
