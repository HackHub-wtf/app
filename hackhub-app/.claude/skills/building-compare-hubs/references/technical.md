# Technical Reference — Compare Hubs

## When to use
When building comparison or alternatives pages that need URL-driven state, type-safe feature descriptors, and Mantine table/grid layouts.

## Patterns

**Route registration** — add both comparison and alternatives routes to `src/App.tsx`:
```tsx
<Route path="/compare/:slugA/:slugB" element={<CompareHackathons />} />
<Route path="/alternatives/:slug" element={<HackathonAlternatives />} />
```

**Parallel data fetching** — run both queries simultaneously; don't chain them:
```tsx
const { slugA, slugB } = useParams<{ slugA: string; slugB: string }>()
const queryA = useQuery({ queryKey: ['hackathon', slugA], queryFn: () => HackathonService.getBySlug(slugA!), staleTime: 5 * 60 * 1000 })
const queryB = useQuery({ queryKey: ['hackathon', slugB], queryFn: () => HackathonService.getBySlug(slugB!), staleTime: 5 * 60 * 1000 })
if (queryA.isLoading || queryB.isLoading) return <Loader />
if (!queryA.data || !queryB.data) return <ErrorMessage />
```

**Feature descriptor map** — define features as data, not JSX, so adding a row is one line:
```tsx
const FEATURES: FeatureDescriptor<Hackathon>[] = [
  { label: 'Max team size', getValue: h => h.maxTeamSize },
  { label: 'Real-time chat', getValue: h => h.hasChat, format: v => <Badge color={v ? 'green' : 'gray'}>{v ? 'Yes' : 'No'}</Badge> },
]
```

## Pitfalls
- Never store the selected subjects in component state — comparison URLs won't be shareable or indexable if params are dropped.
- Always handle both `isLoading` and `data === undefined` states before rendering the table; Mantine `Table` does not guard against undefined rows.