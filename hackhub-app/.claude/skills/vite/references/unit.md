# Unit Testing Vite Config

## When to use
When verifying that `vite.config.ts` resolves aliases, applies plugins correctly, or exposes the right environment variables in isolation.

## Patterns

**Test alias resolution**
```typescript
import { resolve } from 'path'
import { mergeConfig } from 'vite'
import baseConfig from '../vite.config'

it('resolves @ alias to src/', () => {
  const alias = baseConfig.resolve?.alias as Record<string, string>
  expect(alias['@']).toBe(resolve(__dirname, '../src'))
})
```

**Test VITE_* env vars are present at build time**
```typescript
it('only exposes VITE_ prefixed vars', () => {
  const exposed = Object.keys(import.meta.env).filter(k => !k.startsWith('VITE_'))
  expect(exposed.filter(k => k !== 'MODE' && k !== 'BASE_URL' && k !== 'DEV' && k !== 'PROD' && k !== 'SSR')).toHaveLength(0)
})
```

**Test plugin list contains react**
```typescript
import config from '../vite.config'

it('includes react plugin', () => {
  const pluginNames = (config.plugins as { name: string }[]).map(p => p.name)
  expect(pluginNames).toContain('vite:react-babel')
})
```

## Pitfalls
- `import.meta.env` is only defined in Vite-transformed modules. In raw Node/Vitest tests, mock it explicitly or use `loadEnv` from `vite` to read `.env.local`.