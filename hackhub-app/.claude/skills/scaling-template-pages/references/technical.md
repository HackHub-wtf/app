# Technical Reference — Scaling Template Pages

## When to use
When adding a new searchable/filterable listing page for any HackHub entity (hackathons, teams, ideas, users).

## Patterns

### queryKey derived from filter state
```typescript
const { data = [], isLoading, error } = useQuery({
  queryKey: ['hackathons', { query, status }],
  queryFn: () => HackathonService.search({ query, status }),
  staleTime: 2 * 60 * 1000,
})
```
React Query re-fetches automatically when filter values change — no manual effect needed.

### URL params as source of truth
```typescript
const [searchParams, setSearchParams] = useSearchParams()
const query = searchParams.get('q') ?? ''

function handleQueryChange(value: string) {
  setSearchParams(prev => { prev.set('q', value); return prev })
}
```
Filters survive refresh and can be shared as links.

### Mandatory state gates before rendering results
```typescript
if (isLoading) return <Loader mx="auto" />
if (error) return <Alert color="red">{(error as Error).message}</Alert>
if (data.length === 0) return <Text c="dimmed">No results found.</Text>
return <SimpleGrid>{data.map(renderItem)}</SimpleGrid>
```

## Pitfalls
Never skip the empty state — a missing guard causes a silent blank page that looks like a data load failure.