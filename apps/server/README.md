# A2A Inspector Server

The inspector serves the built conversation UI and a same-origin A2A proxy on `http://localhost:19999`.

```bash
bun run dev
```

The browser connects only to the fixed `local` proxy target. Its upstream defaults to `http://localhost:8000`; override it with `A2A_LOCAL_TARGET_URL`.

```bash
A2A_LOCAL_TARGET_URL=http://localhost:9000 bun run dev
```

Private upstream addresses are accepted for local development. Set `NODE_ENV=production` to retain the proxy's default public-address restriction. Production integrations should replace the local target with an explicit target registry and any server-owned authorization headers.

Build a distributable CLI and static UI with:

```bash
bun run build
```
