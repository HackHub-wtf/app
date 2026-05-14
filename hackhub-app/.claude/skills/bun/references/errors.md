# Bun Errors

## When to use
When diagnosing install failures, script errors, or environment mismatches when running HackHub with Bun.

### `Cannot find module` after switching lockfiles
**Cause:** `bun.lockb` and `package-lock.json` coexist; Bun installed a different resolution.  
**Fix:** Delete `node_modules` and `package-lock.json`, then `bun install`.

### `error: husky - command not found`
**Cause:** `prepare` script ran before `node_modules/.bin` was populated.  
**Fix:** Run `bun install` first (it triggers `prepare` automatically), or `bun run prepare` explicitly.

### `.env.local` variables undefined at runtime
**Cause:** Script run with `node` instead of `bun run` — Node does not auto-load `.env.local`.  
**Fix:** Use `bun run <script>` so Bun's built-in `.env.local` loader applies, or explicitly load with `dotenv`.

## Pitfalls
- Never mix `bun install` and `npm install` in the same environment — the lockfiles diverge silently and produce subtly different `node_modules` trees.
- Bun's `.env.local` auto-load only applies when Bun is the process runner. Vite loads it independently via its own mechanism; they do not conflict but both must be present.