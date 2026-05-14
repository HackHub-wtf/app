# Bun Patterns

## When to use
When running installs, scripts, or one-off files with Bun as the runtime in HackHub.

### Frozen install in CI
```bash
bun install --frozen-lockfile
```

### Run any package.json script
```bash
bun run dev
bun run build
bun run lint
bun run seed-data
```

### Run a script file directly
```bash
bun seed-data.js   # no `node` prefix needed
```

## Pitfalls
- Run all `bun` commands from `HackHub-wtf/app/`, not the repo root.
- Commit `bun.lockb` when switching from `package-lock.json` — mixed lockfiles cause install conflicts.
- Do not use Bun-specific APIs (e.g. `Bun.serve`) in application code; HackHub must stay Node-compatible.