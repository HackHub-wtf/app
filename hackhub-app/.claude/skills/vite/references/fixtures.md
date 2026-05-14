# Test Fixtures for Vite Builds

## When to use
When integration or E2E tests need a pre-built bundle, a known `dist/` snapshot, or a stable set of env vars to test against Cloudflare Pages deployment behavior.

## Patterns

**Shared env fixture for all tests**
```typescript
// tests/fixtures/env.ts
export const testEnv = {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_APP_NAME: 'HackHub-Test',
  VITE_APP_ENVIRONMENT: 'test',
} as const
```

**Build fixture — run once, reuse**
```typescript
// tests/fixtures/build.ts
import { build } from 'vite'

export async function buildOnce() {
  if (!existsSync('./dist/index.html')) {
    await build({ configFile: './vite.config.ts' })
  }
}
```

**Cloudflare Pages headers fixture**
```
# tests/fixtures/_headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```
Place in `public/` so Vite copies it to `dist/` — verify its presence in deployment smoke tests.

## Pitfalls
- Don't commit a `dist/` fixture to the repo. Generate it in CI with `npm run build` before running tests, and add `dist/` to `.gitignore`. Stale fixtures cause false-positive passes when the actual build is broken.