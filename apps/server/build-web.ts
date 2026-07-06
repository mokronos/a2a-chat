import { realpathSync, watch } from "node:fs"
import { resolve } from "node:path"

// Bundles the inspector web app.
//
// Why this exists instead of a plain `bun build` CLI call:
// `@mokronos/a2a-react` is reachable through more than one path — the workspace
// symlink under apps/server/node_modules (from web/main.tsx) and the one under
// packages/ui/node_modules (from the pre-built ui dist) — and bun's resolver
// even prefers a stale published 0.3.0 copy in its global install cache. The
// bundler keys module identity by the resolved file path, so these divergent
// resolutions bundle a2a-react more than once. Two copies means two React
// contexts: the <A2AChatProvider> from one copy can't satisfy the useA2AChat()
// hook baked into the ui components (the other copy), so every consumer throws
// "useA2AChat must be used within <A2AChatProvider>" and the page renders blank.
//
// The plugin below pins a2a-react to the single canonical workspace build
// (packages/react/dist) regardless of which importer or resolution reached it.
// The CLI `bun build` has no way to inject a resolver plugin, hence this script.
const A2A_REACT_DIST = realpathSync(
  resolve(import.meta.dir, "node_modules/@mokronos/a2a-react/dist/index.js"),
)

const pinA2AReact: import("bun").BunPlugin = {
  name: "pin-a2a-react",
  setup(build) {
    build.onResolve({ filter: /^@mokronos\/a2a-react$/ }, () => ({
      path: A2A_REACT_DIST,
    }))
  },
}

async function runBuild(): Promise<boolean> {
  const result = await Bun.build({
    entrypoints: ["./web/main.tsx"],
    outdir: "./public/assets",
    naming: "app.js",
    target: "browser",
    format: "esm",
    plugins: [pinA2AReact],
  })
  for (const log of result.logs) console.error(log)
  return result.success
}

const isWatch = process.argv.includes("--watch")
const ok = await runBuild()

if (!isWatch) {
  process.exit(ok ? 0 : 1)
} else {
  console.log("[build-web] watching for changes…")
  // Rebuild when the app source or either dependency's dist output changes
  // (the ui / react package watchers rewrite those dists on their own).
  const watched = ["./web", "../../packages/react/dist", "../../packages/ui/dist"]
  let timer: ReturnType<typeof setTimeout> | undefined
  const trigger = () => {
    clearTimeout(timer)
    timer = setTimeout(() => void runBuild(), 100)
  }
  for (const dir of watched) {
    try {
      watch(dir, { recursive: true }, trigger)
    } catch {
      // A dist dir may not exist yet on first run; the debounced rebuild picks
      // it up once its package builds.
    }
  }
}
