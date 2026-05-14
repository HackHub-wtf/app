# Programmatic Search Patterns

## When to use
When implementing or auditing client-side search logic in React components — filtering arrays in memory, debouncing inputs, and wiring Supabase query params to UI controls.

## Patterns

**Debounced search input with React Query refetch:**
```typescript
const [query, setQuery] = useState('')
const debouncedQuery = useDebounce(query, 300)

const { data: ideas } = useQuery({
  queryKey: ['ideas', hackathonId, debouncedQuery],
  queryFn: () => IdeaService.search(hackathonId, debouncedQuery),
  enabled: debouncedQuery.length >= 2
})
```

**Client-side filter on cached data (avoid over-fetching):**
```typescript
const { data: teams } = useQuery({ queryKey: ['teams', hackathonId], ... })
const filtered = useMemo(
  () => teams?.filter(t => t.name.toLowerCase().includes(query.toLowerCase())) ?? [],
  [teams, query]
)
```

**URL-persisted search state via React Router:**
```typescript
const [searchParams, setSearchParams] = useSearchParams()
const query = searchParams.get('q') ?? ''
// Update on input change:
setSearchParams({ q: value }, { replace: true })
```
URL-persisted search makes results shareable and bookmarkable.

## Pitfalls
- Client-side filtering only works if all records are already fetched. For paginated or large datasets (hackathons with hundreds of ideas), push filtering to Supabase rather than filtering in memory.