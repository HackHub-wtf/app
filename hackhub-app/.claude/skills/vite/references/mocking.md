# Mocking Vite Globals in Tests

## When to use
When component or service tests reference `import.meta.env`, `import.meta.hot`, or other Vite-injected globals that don't exist in the raw Node/Vitest environment.

## Patterns

**Mock `import.meta.env` in Vitest**
```typescript
// vitest.config.ts
export default {
  test: {
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_APP_ENVIRONMENT: 'test',
    },
  },
}
```

**Override a single var per test**
```typescript
it('uses production URL', () => {
  const original = import.meta.env.VITE_SUPABASE_URL
  import.meta.env.VITE_SUPABASE_URL = 'https://prod.supabase.co'
  // ... test
  import.meta.env.VITE_SUPABASE_URL = original
})
```

**Stub HMR to prevent errors in tests**
```typescript
// test/setup.ts
Object.defineProperty(import.meta, 'hot', { value: undefined })
```

## Pitfalls
- Never rely on `.env.local` being loaded automatically in Vitest — it isn't. Set vars explicitly in `vitest.config.ts` or via `loadEnv('test', process.cwd())`. Forgetting this causes `undefined` Supabase URL errors that look like network failures.