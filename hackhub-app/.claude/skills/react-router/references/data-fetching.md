# Data Fetching with Route Params

## When to use
Route params drive query keys. Fetch data in page components after extracting params with `useParams`.

**Basic param-driven query**
```typescript
function HackathonDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonService.getById(id!),
    enabled: !!id
  })

  if (isLoading) return <Loader />
  return <HackathonView hackathon={data!} />
}
```

**Search params as filter state**
```typescript
function HackathonList() {
  const [params] = useSearchParams()
  const status = params.get('status') ?? 'active'

  const { data } = useQuery({
    queryKey: ['hackathons', status],
    queryFn: () => hackathonService.list({ status })
  })
}
```

**Navigate after mutation**
```typescript
const navigate = useNavigate()
const create = useMutation({
  mutationFn: TeamService.createTeam,
  onSuccess: (team) => navigate(`/teams/${team.id}`)
})
```

## Pitfalls
- Always set `enabled: !!id` when param could be undefined at first render — avoids a request with `"undefined"` as a query key.
- Keep `queryKey` arrays stable; route params change when the user navigates, so React Query will re-fetch automatically.