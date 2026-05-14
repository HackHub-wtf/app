---
name: scaling-template-pages
description: Builds scalable, template-driven search pages for HackHub using React 19, Mantine 8, TanStack Query, and React Router 7
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Scaling Template Pages Skill

Builds reusable, data-driven search and listing pages for HackHub by composing a shared page template with pluggable filters, result renderers, and TanStack Query data fetching. Pages built with this pattern share URL-synced search state, consistent empty/loading/error states, and Mantine UI primitives — so adding a new searchable entity means wiring a service call and a card component, not rebuilding the shell.

## Quick Start

1. Identify the entity to search (hackathons, teams, ideas, users).
2. Create or confirm a service method that accepts filter params and returns a typed array.
3. Build a card component for a single result item (`src/components/<Entity>Card.tsx`).
4. Create the page in `src/pages/<Entities>.tsx` using the patterns below.
5. Register the route in `src/App.tsx`.

## Key Concepts

**URL-synced filters** — use `useSearchParams` from React Router so filters survive page refresh and can be shared as links.

**TanStack Query for server state** — never fetch in `useEffect`. Derive `queryKey` from active filter values so React Query re-fetches automatically when filters change.

**Mantine `TextInput` + `Select` for filter controls** — keep filter state local with `useState`, flush to URL params on submit or on change depending on UX requirements.

**Typed service contracts** — service methods must accept a strongly-typed filter object and return `Promise<Entity[]>`. Never pass raw `any` query strings into Supabase from a page component.

**Empty, loading, and error states are mandatory** — every listing page must handle all three before rendering results.

## Common Patterns

### Filter state synced to URL

```typescript
import { useSearchParams } from 'react-router-dom'

export function HackathonsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? 'all'

  const { data: hackathons = [], isLoading, error } = useQuery({
    queryKey: ['hackathons', { query, status }],
    queryFn: () => HackathonService.search({ query, status }),
    staleTime: 2 * 60 * 1000,
  })

  function handleQueryChange(value: string) {
    setSearchParams(prev => { prev.set('q', value); return prev })
  }

  // ...
}
```

### Shared page shell with Mantine

```typescript
import { Container, Stack, TextInput, SimpleGrid, Loader, Alert, Text } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

function SearchPage<T>({
  title,
  queryKey,
  queryFn,
  renderItem,
}: SearchPageProps<T>) {
  const [q, setQ] = useState('')

  const { data = [], isLoading, error } = useQuery({
    queryKey: [queryKey, q],
    queryFn: () => queryFn(q),
  })

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <TextInput
          placeholder={`Search ${title}...`}
          leftSection={<IconSearch size={16} />}
          value={q}
          onChange={e => setQ(e.currentTarget.value)}
        />
        {isLoading && <Loader mx="auto" />}
        {error && <Alert color="red">{(error as Error).message}</Alert>}
        {!isLoading && data.length === 0 && <Text c="dimmed">No {title} found.</Text>}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {data.map(item => renderItem(item))}
        </SimpleGrid>
      </Stack>
    </Container>
  )
}
```

### Service contract

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

### Zod filter validation at the boundary

```typescript
const hackathonFiltersSchema = z.object({
  query: z.string().default(''),
  status: z.enum(['all', 'active', 'upcoming', 'ended']).default('all'),
})

type HackathonFilters = z.infer<typeof hackathonFiltersSchema>

function parseFilters(params: URLSearchParams): HackathonFilters {
  return hackathonFiltersSchema.parse({
    query: params.get('q'),
    status: params.get('status'),
  })
}
```