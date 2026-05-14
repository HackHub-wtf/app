# Bun Types

## When to use
When writing scripts that run under Bun and need access to Bun globals or want to type-check against the Bun runtime API.

### Install Bun type definitions
```bash
bun add -d @types/bun
```

### Use Bun globals in a script
```typescript
/// <reference types="bun-types" />

const file = Bun.file('data.json')
const json = await file.json()
```

### Keep application code runtime-agnostic
```typescript
// ✓ Good: works in both Node and Bun
import { readFileSync } from 'fs'

// ✗ Bad: Bun-only, breaks Node CI
const text = await Bun.file('config.json').text()
```

## Pitfalls
- `@types/bun` and `@types/node` can conflict — do not mix them in the same `tsconfig.json` `types` array.
- HackHub's `tsconfig.json` targets Node; add Bun types only in standalone scripts, not in `src/`.