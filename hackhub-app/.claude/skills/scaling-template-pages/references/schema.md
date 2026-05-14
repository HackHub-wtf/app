# Schema Patterns — Scaling Template Pages

## When to use
When defining Zod schemas and TypeScript types for filter objects and service contracts.

## Patterns

### Filter schema with defaults
```typescript
const hackathonFiltersSchema = z.object({
  query: z.string().default(''),
  status: z.enum(['all', 'active', 'upcoming', 'ended']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
})

type HackathonFilters = z.infer<typeof hackathonFiltersSchema>
```

### Card prop type
```typescript
interface HackathonCardProps {
  hackathon: Hackathon
  onClick?: (id: string) => void
}
```

### Generic page config type
```typescript
interface SearchPageConfig<T> {
  title: string
  queryKey: string
  queryFn: (filters: Record<string, string>) => Promise<T[]>
  renderItem: (item: T) => React.ReactNode
}
```

## Pitfalls
Don't redefine filter types inline per page — extract a shared schema per entity in `src/types/` and import it in both the service and the page.