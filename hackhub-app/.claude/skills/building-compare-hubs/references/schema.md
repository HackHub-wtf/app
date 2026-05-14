# Schema Reference — Compare Hubs

## When to use
When defining or extending the TypeScript types and Zod schemas that power comparison pages in HackHub.

## Patterns

**ComparisonItem base type** — minimal shape every comparable entity must satisfy:
```ts
// src/types/compare.types.ts
export interface ComparisonItem {
  id: string
  slug: string
  name: string
  tags: string[]
}
```

**FeatureDescriptor generic** — typed descriptor that drives table row rendering:
```ts
export interface FeatureDescriptor<T extends ComparisonItem> {
  label: string
  getValue: (item: T) => string | number | boolean
  format?: (val: ReturnType<FeatureDescriptor<T>['getValue']>) => React.ReactNode
}
```

**Zod schema for route param validation** — parse slugs from URL at the service boundary:
```ts
import { z } from 'zod'

export const compareParamsSchema = z.object({
  slugA: z.string().min(1).regex(/^[a-z0-9-]+$/),
  slugB: z.string().min(1).regex(/^[a-z0-9-]+$/),
})
```

## Pitfalls
- Don't extend `ComparisonItem` with optional fields used only in `getValue` — callers must handle `undefined` inside the descriptor, which breaks the generic contract.
- Avoid `any` in `FeatureDescriptor` — if the value type can't be inferred, use a union (`string | number | boolean`) rather than widening to `any`.