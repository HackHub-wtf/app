# Integration Testing Vite Dev Server

## When to use
When verifying that the full dev server starts, serves assets, proxies Supabase correctly, or that the production bundle can be previewed end-to-end.

## Patterns

**Start and stop dev server in tests**
```typescript
import { createServer, ViteDevServer } from 'vite'

let server: ViteDevServer

beforeAll(async () => {
  server = await createServer({ configFile: './vite.config.ts', server: { port: 5174 } })
  await server.listen()
})

afterAll(() => server.close())

it('serves index.html', async () => {
  const res = await fetch('http://localhost:5174/')
  expect(res.status).toBe(200)
})
```

**Verify production build output exists**
```typescript
import { existsSync } from 'fs'
import { resolve } from 'path'

it('build produces index.html', () => {
  expect(existsSync(resolve(__dirname, '../dist/index.html'))).toBe(true)
})
```

**Check Supabase proxy in dev config**
```typescript
it('proxies /supabase to localhost:54321', () => {
  const proxy = config.server?.proxy as Record<string, { target: string }>
  expect(proxy['/supabase']?.target).toBe('http://localhost:54321')
})
```

## Pitfalls
- Use a different port (e.g. `5174`) for test servers to avoid colliding with a running `npm run dev` on `5173`. Always call `server.close()` in `afterAll` or port conflicts will persist across test runs.