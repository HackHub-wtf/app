# Programmatic Patterns — Scaling Template Pages

## When to use
When building service methods and filter parsing logic that back a template search page.

## Patterns

### Typed service method
```typescript
interface HackathonFilters {
  query: string
  status: 'all' | 'active' | 'upcoming' | 'ended'
}

export class HackathonService {
  static async search(filters: HackathonFilters): Promise<Hackathon[]> {
    let builder = supabase.from('hackathons').select('*')
    if (filters.query) builder = builder.ilike('name', `%${filters.query}%`)
    if (filters.status !== 'all') builder = builder.eq('status', filters.status)
    const { data, error } = await builder
    if (error) throw new Error(error.message)
    return data
  }
}
```

### URL param parser with Zod
```typescript
const filtersSchema = z.object({
  query: z.string().default(''),
  status: z.enum(['all', 'active', 'upcoming', 'ended']).default('all'),
})

function parseFilters(params: URLSearchParams) {
  return filtersSchema.parse({
    query: params.get('q'),
    status: params.get('status'),
  })
}
```

### Route registration in App.tsx
```typescript
<Route path="/hackathons" element={<HackathonsPage />} />
```

## Pitfalls
Never pass raw `URLSearchParams` or untyped strings directly into Supabase queries — always parse through a typed filter object first.